class FarmActivityService
  def initialize(farm_activity, user)
    @farm_activity = farm_activity
    @user = user
  end

  # Tạo mới hoạt động nông trại - thêm xử lý materials
  def create_activity(params)
    # Tách materials khỏi params để xử lý riêng
    materials = params.delete(:materials)
    
    # Đặt skip_materials_check = true để tránh validate materials khi chưa lưu
    @farm_activity.skip_materials_check = true
    
    # Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    ActiveRecord::Base.transaction do
      # Gán thuộc tính từ params
      @farm_activity.assign_attributes(params)
      
      if @farm_activity.save
        # Xử lý materials nếu có
        process_materials(materials) if materials.present?
        
        # Kiểm tra lại sau khi xử lý vật tư
        if @farm_activity.requires_materials? && @farm_activity.activity_materials.reload.empty?
          @farm_activity.errors.add(:base, "Hoạt động cần có ít nhất một vật tư")
          raise ActiveRecord::Rollback
        end
        
        # Cập nhật PineappleCrop nếu cần
        update_pineapple_crop_if_needed
      else
        # Không lưu được, rollback
        raise ActiveRecord::Rollback
      end
    end
    
    # Kiểm tra nếu có lỗi sau khi xử lý
    return @farm_activity unless @farm_activity.persisted?
    
    # Kiểm tra lại nếu hoạt động yêu cầu vật tư nhưng không có
    if @farm_activity.requires_materials? && @farm_activity.activity_materials.reload.empty?
      @farm_activity.errors.add(:base, "Hoạt động cần có ít nhất một vật tư")
      # Xóa record đã tạo nếu không có vật tư
      @farm_activity.destroy
    end
    
    @farm_activity
  end

  # Cập nhật hoạt động nông trại - thêm xử lý materials
  def update_activity(params)
    # Tách materials khỏi params để xử lý riêng
    materials_params = params.delete(:materials)

    # Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    ActiveRecord::Base.transaction do
      # Cập nhật farm_activity
      @farm_activity.assign_attributes(params)
      
      if @farm_activity.save
        # Xử lý materials nếu có
        process_materials(materials_params) if materials_params.present?
        return @farm_activity
      else
        raise ActiveRecord::Rollback
        return @farm_activity
      end
    end

    @farm_activity
  end

  # Đánh dấu hoàn thành hoạt động - cập nhật để xử lý vật tư
  def complete_activity(params)
    # Cập nhật thông tin hoàn thành
    @farm_activity.actual_completion_date = Date.today
    @farm_activity.actual_notes = params[:actual_notes] if params[:actual_notes].present?
    @farm_activity.status = :completed

    # Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    ActiveRecord::Base.transaction do
      # Cập nhật vật tư sử dụng thực tế
      if params[:actual_materials].present?
        success = update_actual_materials(params[:actual_materials])
        unless success
          raise ActiveRecord::Rollback
          return { success: false, error: "Không đủ vật tư để hoàn thành hoạt động" }
        end
      end

      if @farm_activity.save
        # Cập nhật pineapple_crop sau khi hoàn thành hoạt động
        update_pineapple_crop_after_completion
        
        # Bổ sung: Kiểm tra chuyển giai đoạn
        suggestion = check_stage_completion
        
        return { success: true, suggestion: suggestion }
      else
        raise ActiveRecord::Rollback
        return { success: false, error: @farm_activity.errors.full_messages.join(", ") }
      end
    end

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

  # Thêm phương thức xử lý materials khi tạo/cập nhật activity
  def process_materials(materials)
    Rails.logger.info("Processing materials: #{materials.inspect}")
    
    # Xóa các liên kết cũ nếu là update
    @farm_activity.activity_materials.destroy_all if @farm_activity.activity_materials.exists?
    
    # Tạo mới các liên kết
    materials.each do |material_id, quantity|
      Rails.logger.info("Processing material_id: #{material_id} (#{material_id.class.name}), quantity: #{quantity}")
      
      # Chuyển đổi material_id từ string sang integer
      material_id = material_id.to_i if material_id.is_a?(String)
      
      material = @user.farm_materials.find_by(id: material_id)
      Rails.logger.info("Found material: #{material ? 'Yes' : 'No'}")
      
      if material.nil?
        Rails.logger.warn("Material #{material_id} not found for user #{@user.id}")
        next
      end
      
      if quantity.to_f <= 0
        Rails.logger.warn("Quantity #{quantity} is not positive")
        next
      end
      
      activity_material = @farm_activity.activity_materials.create(
        farm_material_id: material_id,
        planned_quantity: quantity.to_f
      )
      
      Rails.logger.info("Created activity_material: #{activity_material.persisted? ? 'Yes' : 'No'}")
      if !activity_material.persisted?
        Rails.logger.error("Failed to create activity_material: #{activity_material.errors.full_messages}")
      end
    end
    
    # Kiểm tra lại sau khi tạo
    Rails.logger.info("Activity has materials? #{!@farm_activity.activity_materials.reload.empty?}")
    
    # Kiểm tra nếu activity yêu cầu materials nhưng không có
    validate_materials_requirement
  end
  
  # Phương thức kiểm tra yêu cầu vật tư
  def validate_materials_requirement
    # Sử dụng danh sách từ model để đảm bảo nhất quán
    required_activities = FarmActivity::MATERIAL_REQUIRED_ACTIVITIES
    
    # Nếu hoạt động yêu cầu vật tư nhưng không có
    if required_activities.include?(@farm_activity.activity_type.to_s) && @farm_activity.activity_materials.reload.empty?
      @farm_activity.errors.add(:base, "Hoạt động này cần có ít nhất một vật tư")
      return false
    end
    
    true
  end
  
  # Cập nhật vật tư thực tế sử dụng và giảm số lượng trong kho
  def update_actual_materials(actual_materials)
    actual_materials.each do |material_id, quantity|
      quantity = quantity.to_f
      next if quantity <= 0
      
      # Tìm liên kết activity_material
      activity_material = @farm_activity.activity_materials.find_by(farm_material_id: material_id)
      material = @user.farm_materials.find_by(id: material_id)
      
      # Kiểm tra xem còn đủ vật tư không
      if material.nil? || material.quantity < quantity
        return false # Không đủ vật tư
      end
      
      # Nếu không tìm thấy, tạo mới liên kết
      unless activity_material
        activity_material = @farm_activity.activity_materials.create(
          farm_material_id: material_id,
          planned_quantity: quantity,
          actual_quantity: quantity
        )
      else
        activity_material.update(actual_quantity: quantity)
      end
      
      # Giảm số lượng vật tư trong kho
      material.quantity -= quantity
      material.last_updated = Time.current
      material.save
    end
    
    true
  end
end
