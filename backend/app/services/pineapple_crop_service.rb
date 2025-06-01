class PineappleCropService
  def initialize(pineapple_crop, user)
    @pineapple_crop = pineapple_crop
    @user = user
  end

  def create(params)
    @pineapple_crop.assign_attributes(params)
    @pineapple_crop.user_id = @user.id

    if @pineapple_crop.save
        generate_stage_plan
      return @pineapple_crop
    end

    @pineapple_crop
  end

  # Cập nhật vụ trồng dứa
  def update(params)
    if @pineapple_crop.update(params)
      return @pineapple_crop
    end

    @pineapple_crop
  end

  # Tạo kế hoạch đầy đủ cho cả chu kỳ
  def generate_full_plan
    return false unless @pineapple_crop.planting_date.present?

    # Xóa tất cả hoạt động đang chờ hoặc đang thực hiện
    @pineapple_crop.farm_activities.where(status: [ :pending, :in_progress ]).destroy_all

    # Thiết lập các mốc thời gian quan trọng
    calculate_key_dates

    # Bọc trong transaction để đảm bảo tính toàn vẹn
    ActiveRecord::Base.transaction do
      # Tạo hoạt động cho tất cả các giai đoạn
      create_activities_from_templates

      # Cập nhật trạng thái
      @pineapple_crop.update!(status: :active)
    end

    true
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Lỗi khi tạo kế hoạch: #{e.message}"
    false
  end

  # Tạo kế hoạch cho giai đoạn hiện tại
  def generate_stage_plan
    return false unless @pineapple_crop.current_stage.present?

    create_activities_for_stage(@pineapple_crop.current_stage)

    true
  end

  # Chuyển sang giai đoạn tiếp theo
  def advance_to_next_stage
    if @pineapple_crop.advance_to_next_stage
      # Tạo hoạt động cho giai đoạn mới
      create_activities_for_stage(@pineapple_crop.current_stage)
      return true
    end

    false
  end

  # Ghi nhận thu hoạch
  def record_harvest(quantity)
    return false unless @pineapple_crop.current_stage == "harvesting"

    # Cập nhật sản lượng thực tế
    current_yield = @pineapple_crop.actual_yield || 0
    @pineapple_crop.update(actual_yield: current_yield + quantity)

    # Tạo bản ghi thu hoạch
    harvest = Harvest.new(
      user_id: @user.id,
      crop_id: @pineapple_crop.id,
      quantity: quantity,
      harvest_date: Time.current,
      field_id: @pineapple_crop.field_id
    )

    if harvest.save
      # Kiểm tra nếu đã thu hoạch xong
      if @pineapple_crop.actual_yield >= @pineapple_crop.expected_yield
        @pineapple_crop.advance_to_next_stage # Chuyển sang giai đoạn tiếp theo (tách chồi)
      end

      return true
    end

    false
  end

  # Thêm phương thức này vào PineappleCropService
  def clean_and_regenerate
    # Xóa tất cả hoạt động chưa hoàn thành
    @pineapple_crop.farm_activities.where.not(status: :completed).destroy_all

    # Tạo lại kế hoạch
    generate_full_plan
  end

  def preview_plan(crop_params)
    temp_crop = PineappleCrop.new(crop_params)
    stages = PineappleCrop.current_stages.keys
    activities = []
    stages.each do |stage|
      templates = get_templates_for_stage(stage, temp_crop)
      templates.each do |template|
        reference_date = temp_crop.get_reference_date_for_stage(stage)
        start_date = reference_date + template.day_offset.days
        end_date = start_date + template.duration_days.days
        activities << FarmActivity.new(
          activity_type: template.activity_type,
          description: template.description || template.name,
          start_date: start_date,
          end_date: end_date,
          frequency: 0,
          status: 0,
          field_id: temp_crop.field_id
        )
      end
    end
    activities
  end

  # Lưu danh sách công đoạn đã xác nhận vào DB
  def save_plan(activities_params)
    created = []
    ActiveRecord::Base.transaction do
      @pineapple_crop.farm_activities.destroy_all

      activities_params.each do |act|
        activity = @pineapple_crop.farm_activities.new(
          activity_type: act[:activity_type],
          description: act[:description],
          start_date: act[:start_date],
          end_date: act[:end_date],
          frequency: act[:frequency] || 0,
          status: 0,
          user_id: @user.id,
          field_id: act[:field_id] || @pineapple_crop.field_id
        )

        # Bỏ qua kiểm tra trùng lặp khi tạo từ template
        activity.skip_similar_check = true
        activity.save!

        created << activity
      end
    end
    created
  end

  private

  # Tính toán các mốc thời gian quan trọng trong chu kỳ
  def calculate_key_dates
    planting_date = @pineapple_crop.planting_date
    season_type = @pineapple_crop.season_type
    return false unless planting_date.present?

    # Đảm bảo planting_date là một ngày trong tương lai nếu vụ mới
    if @pineapple_crop.new_record? && planting_date < Date.today
      planting_date = Date.today + 15.days
      @pineapple_crop.planting_date = planting_date
    end

    # Chuẩn bị đất (trước trồng 1 tháng)
    land_preparation_date = planting_date - 1.month

    # Ngày thu hoạch nếu chưa có
    harvest_date = @pineapple_crop.harvest_date || (planting_date + 18.months)

    # Các mốc khác dựa theo mùa vụ
    tie_date = nil
    flower_treatment_date = nil
    expected_flower_date = nil

    case season_type
    when "Xuân-Hè"
      tie_date = planting_date + 5.months # Buộc lá sau 4-5 tháng
      flower_treatment_date = planting_date + 10.months
      expected_flower_date = planting_date + 12.months # Sau trồng 10-12 tháng
    when "Thu-Đông"
      flower_treatment_date = planting_date + 10.months
      expected_flower_date = planting_date + 12.months # Sau trồng 10-12 tháng
      # Vụ thu đông không cần buộc lá (tie_date = nil)
    else
      # Mùa vụ mặc định
      tie_date = planting_date + 5.months
      flower_treatment_date = planting_date + 10.months
      expected_flower_date = planting_date + 12.months
    end

    # Cập nhật các mốc thời gian chỉ khi chúng chưa được đặt hoặc không hợp lệ
    @pineapple_crop.update(
      land_preparation_date: @pineapple_crop.land_preparation_date || land_preparation_date,
      tie_date: @pineapple_crop.tie_date || tie_date,
      expected_flower_date: @pineapple_crop.expected_flower_date || expected_flower_date,
      flower_treatment_date: @pineapple_crop.flower_treatment_date || flower_treatment_date,
      harvest_date: @pineapple_crop.harvest_date || harvest_date
    )
  end

  # Tạo các hoạt động từ templates cho tất cả các giai đoạn
  def create_activities_from_templates
    PineappleCrop.current_stages.keys.each do |stage|
      create_activities_for_stage(stage)
    end
  end

  # Tạo hoạt động cho một giai đoạn cụ thể
  def create_activities_for_stage(stage)
    # Lấy templates cho giai đoạn này
    templates = get_templates_for_stage(stage)

    # Tạo hoạt động từ templates
    templates.each do |template|
      create_activity_from_template(template, stage)
    end
  end

    # Lấy templates phù hợp cho một giai đoạn
    def get_templates_for_stage(stage, crop = nil)
    crop ||= @pineapple_crop
    user_templates = PineappleActivityTemplate.where(user_id: @user.id, stage: stage)
    templates = user_templates.empty? ? PineappleActivityTemplate.default_templates.for_stage(stage) : user_templates
    if crop.season_type.present?
        templates = templates.to_a.select do |t|
        t.season_specific.blank? || t.season_specific == crop.season_type
        end
    end
    templates
    end


  # Tạo một hoạt động từ template
  def create_activity_from_template(template, stage)
    # Lấy ngày tham chiếu cho giai đoạn
    reference_date = @pineapple_crop.get_reference_date_for_stage(stage)
    return if reference_date.nil?

    # Tính ngày bắt đầu và kết thúc
    start_date = reference_date + template.day_offset.days
    end_date = start_date + template.duration_days.days

    # Kiểm tra xem đã có hoạt động tương tự hay chưa - tìm kiếm rộng hơn
    existing = @pineapple_crop.farm_activities.where(
      activity_type: template.activity_type,
      field_id: @pineapple_crop.field_id
    )
    .where("description = ? OR description LIKE ?",
           template.description || template.name,
           "%#{template.name}%")
    .where.not(status: :completed)
    .first

    if existing
      # Nếu đã có, cập nhật thay vì tạo mới
      existing.update(
        description: template.description || template.name,
        start_date: start_date,
        end_date: end_date
      )
      existing
    else
      # Tạo mới nếu chưa có, với xử lý lỗi
      begin
        activity = @pineapple_crop.farm_activities.create!(
          activity_type: template.activity_type,
          description: template.description || template.name,
          start_date: start_date,
          end_date: end_date,
          frequency: 0, # once
          status: 0, # pending
          user_id: @user.id,
          field_id: @pineapple_crop.field_id || @user.fields.first&.id
        )
        activity
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.error "Không thể tạo hoạt động từ template #{template.name}: #{e.message}"

        # Cố gắng tạo với ngày khác nếu lỗi do trùng lặp
        if e.message.include?("tương tự") || e.message.include?("similar")
          modified_start = start_date + 2.days
          modified_end = modified_start + template.duration_days.days

          begin
            return @pineapple_crop.farm_activities.create!(
              activity_type: template.activity_type,
              description: "#{template.description || template.name} (điều chỉnh)",
              start_date: modified_start,
              end_date: modified_end,
              frequency: 0,
              status: 0,
              user_id: @user.id,
              field_id: @pineapple_crop.field_id || @user.fields.first&.id
            )
          rescue ActiveRecord::RecordInvalid
            # Nếu vẫn thất bại, bỏ qua template này
            Rails.logger.error "Không thể tạo hoạt động sau khi điều chỉnh ngày"
            return nil
          end
        end

        nil
      end
    end
  end
end
