module Services::Farming
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
      @farm_activity.skip_materials_check = true if @farm_activity.respond_to?(:skip_materials_check=)

      # Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
      ActiveRecord::Base.transaction do
        # Gán thuộc tính từ params
        @farm_activity.assign_attributes(params)

        # Xử lý lịch trình lặp lại
        process_recurring_schedule(params) if @farm_activity.frequency != "once"

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
    rescue ActiveRecord::RecordInvalid => e
      @farm_activity.errors.add(:base, e.message)
      @farm_activity
    end

    # Cập nhật hoạt động nông trại
    def update_activity(params)
      # Tách materials khỏi params để xử lý riêng
      materials = params.delete(:materials)

      # Lưu trữ vật tư cũ để hoàn trả về kho nếu cần
      old_materials = @farm_activity.activity_materials.map do |am|
        [ am.respond_to?(:farm_material_id) ? am.farm_material_id : am.material_id, am.planned_quantity ]
      end.to_h

      # Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
      ActiveRecord::Base.transaction do
        # Cập nhật thông tin cơ bản
        @farm_activity.assign_attributes(params)

        if @farm_activity.save
          # Xử lý materials nếu có
          if materials.present?
            # Trả lại vật tư cũ vào kho nếu cần
            return_materials_to_inventory(old_materials)

            # Xử lý vật tư mới
            process_materials(materials)
          end

          return @farm_activity
        else
          raise ActiveRecord::Rollback
          return @farm_activity
        end
      end

      @farm_activity
    rescue ActiveRecord::RecordInvalid => e
      @farm_activity.errors.add(:base, e.message)
      @farm_activity
    end

    # Xóa/Hủy lịch chăm sóc
    def destroy_activity
      ActiveRecord::Base.transaction do
        # Lấy vật tư đã gán trước đó
        old_materials = @farm_activity.activity_materials.map do |am|
          [ am.respond_to?(:farm_material_id) ? am.farm_material_id : am.material_id, am.planned_quantity ]
        end.to_h

        # Trả lại vật tư vào kho
        return_materials_to_inventory(old_materials)

        # Cập nhật trạng thái thành đã hủy
        @farm_activity.update!(status: :cancelled)
      end
    end

    # Đánh dấu hoàn thành hoạt động
    def complete_activity(params)
      # Cập nhật thông tin hoàn thành
      @farm_activity.status = :completed
      @farm_activity.actual_completion_date = Date.today
      @farm_activity.actual_notes = params[:actual_notes] if params[:actual_notes].present?

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
        stage_templates = ::Models::Farming::PineappleActivityTemplate.where(stage: crop.current_stage)
        stage_activity_types = stage_templates.pluck(:activity_type).uniq
        activities = activities.where(activity_type: stage_activity_types)
      end

      activities.order(start_date: :asc)
    end

    # Class method để kiểm tra hoạt động sắp tới
    def self.check_upcoming_activities
      # Kiểm tra các hoạt động diễn ra trong vòng 1 ngày tới
      tomorrow = Date.tomorrow.beginning_of_day
      tomorrow_end = Date.tomorrow.end_of_day

      ::Farming::FarmActivity.includes(:user, :field)
                  .where("start_date BETWEEN ? AND ?", tomorrow, tomorrow_end)
                  .where(status: [ "pending", "in_progress" ])
                  .find_each do |activity|
        # Kiểm tra xem đã nhắc nhở trong vòng 24h chưa
        last_reminder = ::Notification.where(
          notifiable_type: "Farming::FarmActivity",
          notifiable_id: activity.id,
          event_type: "activity_reminder"
        ).where("created_at > ?", 24.hours.ago).exists?

        unless last_reminder
          ::NotificationServices::FarmNotificationService.new.activity_reminder(activity, 1)
        end
      end

      # Kiểm tra các hoạt động quá hạn
      yesterday = Date.yesterday.end_of_day

      ::Farming::FarmActivity.includes(:user, :field)
                  .where("end_date < ?", yesterday)
                  .where.not(status: "completed")
                  .find_each do |activity|
        # Kiểm tra xem đã cảnh báo trong vòng 24h chưa
        last_alert = ::Notification.where(
          notifiable_type: "Farming::FarmActivity",
          notifiable_id: activity.id,
          event_type: "activity_overdue"
        ).where("created_at > ?", 24.hours.ago).exists?

        unless last_alert
          ::NotificationServices::FarmNotificationService.new.activity_overdue(activity)
        end
      end
    end

    private

    # Xử lý lịch trình lặp lại
    def process_recurring_schedule(params)
      return unless @farm_activity.respond_to?(:frequency) && @farm_activity.frequency.present?

      case @farm_activity.frequency
      when "daily"
        interval_days = 1
      when "weekly"
        interval_days = 7
      when "monthly"
        interval_days = 30
      else
        return # once hoặc giá trị không hợp lệ
      end

      # Tạo lịch lặp lại cho 3 lần tiếp theo
      3.times do |i|
        next_start_date = @farm_activity.start_date + interval_days * (i + 1)
        next_end_date = @farm_activity.end_date + interval_days * (i + 1) if @farm_activity.end_date

        # Tạo bản ghi con liên quan
        ::Farming::FarmActivity.create!(
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

    # Cập nhật PineappleCrop khi tạo hoạt động mới
    def update_pineapple_crop_if_needed
      # Nếu không có liên kết với cây dứa thì bỏ qua
      return unless @farm_activity.crop_animal_id.present?

      pineapple_crop = ::Models::Farming::PineappleCrop.find_by(id: @farm_activity.crop_animal_id)
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

      pineapple_crop = ::Models::Farming::PineappleCrop.find_by(id: @farm_activity.crop_animal_id)
      return unless pineapple_crop

      # Kiểm tra nếu đây là hoạt động cuối cùng trong giai đoạn hiện tại
      current_stage = pineapple_crop.current_stage
      remaining_activities = ::Models::Farming::FarmActivity.where(
        crop_animal_id: pineapple_crop.id,
        status: [ :pending, :in_progress ]
      )

      # Nếu không còn hoạt động nào đang chờ hoặc đang thực hiện, chuyển sang giai đoạn tiếp theo
      if remaining_activities.empty?
        service = ::PineappleCropService.new(pineapple_crop, @user)
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

      crop = ::Models::Farming::PineappleCrop.find_by(id: @farm_activity.crop_animal_id)
      return nil unless crop

      # Kiểm tra nếu tất cả hoạt động của giai đoạn hiện tại đã hoàn thành
      stage_templates = ::Models::Farming::PineappleActivityTemplate.where(stage: crop.current_stage)
      stage_activities = @user.farm_activities
                          .where(crop_animal_id: crop.id,
                                activity_type: stage_templates.pluck(:activity_type))

      if stage_activities.where.not(status: "completed").empty?
        return "Tất cả hoạt động của giai đoạn hiện tại đã hoàn thành. Bạn có thể chuyển sang giai đoạn tiếp theo."
      end

      nil
    end

    # Xử lý materials khi tạo/cập nhật activity
    def process_materials(materials)
      return unless materials.present?
      Rails.logger.info("Processing materials: #{materials.inspect}")

      # Xóa các liên kết cũ nếu là update
      @farm_activity.activity_materials.destroy_all if @farm_activity.activity_materials.exists?

      # Tạo mới các liên kết
      materials.each do |material_id, quantity|
        Rails.logger.info("Processing material_id: #{material_id}, quantity: #{quantity}")

        # Chuyển đổi material_id từ string sang integer
        material_id = material_id.to_i if material_id.is_a?(String)

        material = @user.farm_materials.find_by(id: material_id)

        if material.nil?
          Rails.logger.warn("Material #{material_id} not found for user #{@user.id}")
          next
        end

        if material.quantity < quantity.to_f
          raise ActiveRecord::RecordInvalid.new("Không đủ vật tư #{material.name} trong kho (cần: #{quantity}, còn: #{material.quantity})")
        end

        if quantity.to_f <= 0
          Rails.logger.warn("Quantity #{quantity} is not positive")
          next
        end

        # Trừ vật tư từ kho
        material.update!(quantity: material.quantity - quantity.to_f)

        # Tạo liên kết
        activity_material = @farm_activity.activity_materials.create(
          farm_material_id: material_id,
          planned_quantity: quantity.to_f
        )

        if !activity_material.persisted?
          Rails.logger.error("Failed to create activity_material: #{activity_material.errors.full_messages}")
        end
      end

      # Kiểm tra nếu activity yêu cầu materials nhưng không có
      validate_materials_requirement
    end

    # Phương thức kiểm tra yêu cầu vật tư
    def validate_materials_requirement
      # Sử dụng danh sách từ model để đảm bảo nhất quán
      required_activities = ::Models::Farming::FarmActivity::MATERIAL_REQUIRED_ACTIVITIES

      # Nếu hoạt động yêu cầu vật tư nhưng không có
      if @farm_activity.respond_to?(:activity_type) &&
         required_activities.include?(@farm_activity.activity_type.to_s) &&
         @farm_activity.activity_materials.reload.empty?
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

        # Tìm liên kết activity_material (xử lý cả 2 trường hợp material_id và farm_material_id)
        activity_material = nil
        if @farm_activity.activity_materials.first.respond_to?(:farm_material_id)
          activity_material = @farm_activity.activity_materials.find_by(farm_material_id: material_id)
        else
          activity_material = @farm_activity.activity_materials.find_by(material_id: material_id)
        end

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

    # Trả lại vật tư vào kho
    def return_materials_to_inventory(materials_hash)
      materials_hash.each do |material_id, quantity|
        material = @user.farm_materials.find_by(id: material_id)
        material.update!(quantity: material.quantity + quantity) if material
      end
    end
  end
end
