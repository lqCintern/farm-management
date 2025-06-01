class FarmActivityService
  def initialize(farm_activity, user)
    @farm_activity = farm_activity
    @user = user
  end

  # Tạo mới hoạt động nông trại
  # Thêm xử lý cho các hoạt động liên quan đến pineapple
  def create_activity(params)
    # Chuyển đổi status nếu là enum
    if FarmActivity.defined_enums["status"] && params[:status].present?
        params[:status] = params[:status].downcase # Chuyển thành chữ thường
    end

    @farm_activity.assign_attributes(params)
    @farm_activity.user_id = @user.id

    # Nếu hoạt động này liên quan đến pineapple_crop
    update_pineapple_crop_if_needed if @farm_activity.save

    @farm_activity
  end

  # Cập nhật hoạt động nông trại
  def update_activity(params)
    @farm_activity.assign_attributes(params)
    @farm_activity.save
    @farm_activity
  end

  # Xóa hoạt động nông trại
  def destroy_activity
    @farm_activity.destroy
  end

  # Đánh dấu hoàn thành hoạt động
  def complete_activity(params)
    # Cập nhật thông tin hoàn thành - logic đã có
    @farm_activity.actual_completion_date = Date.today
    @farm_activity.actual_notes = params[:actual_notes] if params[:actual_notes].present?
    @farm_activity.status = :completed

    # Cập nhật vật tư sử dụng thực tế - logic đã có
    if params[:actual_materials].present?
      update_actual_materials(params[:actual_materials])
    end

    # Bổ sung: Kiểm tra chuyển giai đoạn
    suggestion = check_stage_completion if @farm_activity.save

    { success: true, suggestion: suggestion }
  rescue => e
    { success: false, error: e.message }
  end

  # Lấy hoạt động theo giai đoạn
  def get_stage_activities(crop, current_stage_only = false)
    activities = @user.farm_activities.where(crop_animal_id: crop.id)

    if current_stage_only == "true"
      stage_templates = PineappleActivityTemplate.where(stage: crop.current_stage)
      stage_activity_types = stage_templates.pluck(:activity_type).uniq
      activities = activities.where(activity_type: stage_activity_types)
    end

    activities.order(start_date: :asc)
  end

  private

  # Cập nhật PineappleCrop khi tạo hoạt động mới
  def update_pineapple_crop_if_needed
    # Nếu không có liên kết với cây dứa thì bỏ qua
    return unless @farm_activity.crop_animal_id.present?

    pineapple_crop = PineappleCrop.find_by(id: @farm_activity.crop_animal_id)
    return unless pineapple_crop

    # Cập nhật thông tin cây dứa dựa trên loại hoạt động
    case @farm_activity.activity_type
    when "planting"
      pineapple_crop.update(planting_date: @farm_activity.start_date) if pineapple_crop.planting_date.nil?
    when "fertilizing"
      # Xử lý các loại hoạt động khác...
    end
  end

  # Cập nhật PineappleCrop sau khi hoạt động hoàn thành
  def update_pineapple_crop_after_completion
    # Nếu không có liên kết với cây dứa thì bỏ qua
    return unless @farm_activity.crop_animal_id.present?

    pineapple_crop = PineappleCrop.find_by(id: @farm_activity.crop_animal_id)
    return unless pineapple_crop

    # Kiểm tra nếu đây là hoạt động cuối cùng trong giai đoạn hiện tại
    current_stage = pineapple_crop.current_stage
    remaining_activities = FarmActivity.where(
      crop_animal_id: pineapple_crop.id,
      status: [ :pending, :in_progress ]
    )

    # Nếu không còn hoạt động nào đang chờ hoặc đang thực hiện, chuyển sang giai đoạn tiếp theo
    if remaining_activities.empty?
      service = PineappleCropService.new(pineapple_crop, @user)
      service.advance_to_next_stage
    end

    # Cập nhật các mốc quan trọng dựa trên loại hoạt động
    case @farm_activity.activity_type
    when "flower_treatment"
      pineapple_crop.update(actual_flower_date: @farm_activity.actual_completion_date)
    when "harvesting"
      # Xử lý hoạt động thu hoạch...
    end
  end

  # Kiểm tra xem có nên chuyển giai đoạn hay không
  def check_stage_completion
    return nil unless @farm_activity.crop_animal_id.present?

    crop = PineappleCrop.find_by(id: @farm_activity.crop_animal_id)
    return nil unless crop

    # Kiểm tra nếu tất cả hoạt động của giai đoạn hiện tại đã hoàn thành
    stage_templates = PineappleActivityTemplate.where(stage: crop.current_stage)
    stage_activities = @user.farm_activities
                        .where(crop_animal_id: crop.id,
                                activity_type: stage_templates.pluck(:activity_type))

    if stage_activities.where.not(status: "completed").empty?
      return "Tất cả hoạt động của giai đoạn hiện tại đã hoàn thành. Bạn có thể chuyển sang giai đoạn tiếp theo."
    end

    nil
  end
end
