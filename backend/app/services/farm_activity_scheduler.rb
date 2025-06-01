class FarmActivityService
  def initialize(farm_activity, user)
    @farm_activity = farm_activity
    @user = user
  end

  # Tạo lịch chăm sóc
  def create_activity(params)
    ActiveRecord::Base.transaction do
      @farm_activity.assign_attributes(params.except(:materials))

      # Xử lý lịch trình lặp lại
      process_recurring_schedule(params) if @farm_activity.frequency != "once"

      # Xử lý vật tư
      if params[:materials].present?
        process_materials(params[:materials])
      end

      @farm_activity.save!
    end
    @farm_activity
  rescue ActiveRecord::RecordInvalid => e
    @farm_activity.errors.add(:base, e.message)
    @farm_activity
  end

  # Cập nhật lịch chăm sóc
  def update_activity(params)
    ActiveRecord::Base.transaction do
      # Lưu trữ vật tư cũ để hoàn trả về kho nếu cần
      old_materials = @farm_activity.activity_materials.map { |am| [ am.material_id, am.planned_quantity ] }.to_h

      # Cập nhật thông tin cơ bản
      @farm_activity.assign_attributes(params.except(:materials))

      # Xử lý vật tư mới
      if params[:materials].present?
        # Trả lại vật tư cũ vào kho
        return_materials_to_inventory(old_materials)

        # Xử lý vật tư mới
        process_materials(params[:materials])
      end

      @farm_activity.save!
    end
    @farm_activity
  rescue ActiveRecord::RecordInvalid => e
    @farm_activity.errors.add(:base, e.message)
    @farm_activity
  end

  # Hủy lịch chăm sóc
  def destroy_activity
    ActiveRecord::Base.transaction do
      # Trả lại vật tư nếu đã trừ trước đó
      old_materials = @farm_activity.activity_materials.map { |am| [ am.material_id, am.planned_quantity ] }.to_h
      return_materials_to_inventory(old_materials)

      # Cập nhật trạng thái thành đã hủy
      @farm_activity.update!(status: :cancelled)
    end
  end

  # Đánh dấu hoàn thành và cập nhật thông tin thực tế
  def complete_activity(params)
    ActiveRecord::Base.transaction do
      @farm_activity.status = :completed
      @farm_activity.actual_completion_date = Date.today
      @farm_activity.actual_notes = params[:actual_notes] if params[:actual_notes].present?

      # Xử lý số lượng vật tư thực tế sử dụng
      if params[:actual_materials].present?
        process_actual_materials(params[:actual_materials])
      end

      @farm_activity.save!
    end
    @farm_activity
  rescue ActiveRecord::RecordInvalid => e
    @farm_activity.errors.add(:base, e.message)
    @farm_activity
  end

  private

  # Xử lý vật tư khi tạo hoặc cập nhật
  def process_materials(materials)
    materials.each do |material_id, quantity|
      material = @user.materials.find_by(id: material_id)
      unless material
        raise ActiveRecord::RecordInvalid, "Vật tư không tồn tại"
      end

      if material.quantity < quantity.to_i
        raise ActiveRecord::RecordInvalid, "Không đủ vật tư #{material.name} trong kho (cần: #{quantity}, còn: #{material.quantity})"
      end

      # Trừ vật tư từ kho
      material.update!(quantity: material.quantity - quantity.to_i)

      # Tạo liên kết giữa hoạt động và vật tư
      @farm_activity.activity_materials.build(
        material: material,
        planned_quantity: quantity.to_i
      )
    end
  end

  # Xử lý vật tư thực tế khi hoàn thành
  def process_actual_materials(actual_materials)
    actual_materials.each do |material_id, quantity|
      activity_material = @farm_activity.activity_materials.find_by(material_id: material_id)

      if activity_material
        # Nếu sử dụng ít hơn dự kiến, trả lại phần còn thừa vào kho
        if quantity.to_i < activity_material.planned_quantity
          difference = activity_material.planned_quantity - quantity.to_i
          material = activity_material.material
          material.update!(quantity: material.quantity + difference)
        end

        # Cập nhật số lượng thực tế
        activity_material.update!(actual_quantity: quantity.to_i)
      end
    end
  end

  # Trả lại vật tư vào kho
  def return_materials_to_inventory(materials_hash)
    materials_hash.each do |material_id, quantity|
      material = @user.materials.find_by(id: material_id)
      material.update!(quantity: material.quantity + quantity) if material
    end
  end

  # Xử lý lịch trình lặp lại
  def process_recurring_schedule(params)
    case @farm_activity.frequency
    when "daily"
      interval_days = 1
    when "weekly"
      interval_days = 7
    when "monthly"
      interval_days = 30
    else
      return
    end

    # Tạo lịch lặp lại cho 3 lần tiếp theo
    3.times do |i|
      next_start_date = @farm_activity.start_date + interval_days * (i + 1)
      next_end_date = @farm_activity.end_date + interval_days * (i + 1) if @farm_activity.end_date

      # Tạo bản ghi con liên quan
      FarmActivity.create!(
        user: @user,
        crop_animal_id: @farm_activity.crop_animal_id,
        activity_type: @farm_activity.activity_type,
        description: @farm_activity.description,
        status: :pending,
        start_date: next_start_date,
        end_date: next_end_date,
        frequency: "once", # Các bản ghi con không tự tạo thêm
        parent_activity_id: @farm_activity.id
      )
    end
  end
end
