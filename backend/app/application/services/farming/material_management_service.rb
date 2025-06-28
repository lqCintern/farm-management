module Services::Farming
  class MaterialManagementService
    def initialize(notification_service = nil)
      @notification_service = notification_service || Services::NotificationServices::FarmNotificationService.new
    end

    # 1. Xây dựng template (đã có sẵn)
    # Template chỉ định vật tư cần thiết, không ảnh hưởng kho

    # 2. Lập kế hoạch mùa vụ (áp dụng template)
    def plan_activity_from_template(template, field, start_date, end_date, user)
      # Tạo hoạt động từ template
      activity = FarmActivity.create!(
        activity_type: template.activity_type,
        description: template.description,
        start_date: start_date,
        end_date: end_date,
        field: field,
        user: user,
        status: "pending",
        frequency: "once"
      )

      # Copy vật tư từ template
      template.template_activity_materials.includes(:farm_material).each do |template_material|
        # Kiểm tra kho có đủ không
        material = template_material.farm_material
        unless material.has_enough?(template_material.quantity)
          # Gửi thông báo thiếu vật tư
          @notification_service.material_insufficient(activity, [material.name])
          activity.errors.add(:base, "Không đủ vật tư #{material.name} trong kho")
          activity.destroy
          return false
        end

        # Tạo activity material (sẽ tự động reserve)
        ActivityMaterial.create!(
          farm_activity: activity,
          farm_material: material,
          planned_quantity: template_material.quantity
        )
      end

      activity
    end

    # 3. Kiểm tra vật tư trước ngày thực hiện
    def check_materials_before_execution(activity, days_before = 1)
      return unless activity.requires_materials?

      insufficient_materials = []
      activity.activity_materials.each do |material|
        unless material.can_commit?
          insufficient_materials << material.farm_material.name
        end
      end

      if insufficient_materials.any?
        @notification_service.material_check_reminder(activity, days_before)
        return false, insufficient_materials
      end

      [true, []]
    end

    # 4. Bắt đầu thực hiện hoạt động
    def start_activity_execution(activity)
      return false, "Hoạt động không ở trạng thái pending" unless activity.status == "pending"
      
      can_start, insufficient_materials = check_materials_before_execution(activity, 0)
      unless can_start
        return false, "Không đủ vật tư: #{insufficient_materials.join(', ')}"
      end

      # Commit tất cả vật tư
      activity.activity_materials.each do |material|
        unless material.commit_material
          return false, "Không thể commit vật tư #{material.farm_material.name}"
        end
      end

      # Cập nhật trạng thái
      activity.update!(status: "in_progress")
      
      # Gửi thông báo
      @notification_service.activity_started(activity)
      
      [true, "Hoạt động đã bắt đầu"]
    end

    # 5. Hoàn thành hoạt động với actual quantities
    def complete_activity_with_materials(activity, actual_quantities = {})
      return false, "Hoạt động không ở trạng thái in_progress" unless activity.status == "in_progress"

      # Cập nhật actual quantities và tính toán chênh lệch
      material_differences = {}
      
      actual_quantities.each do |material_id, actual_qty|
        activity_material = activity.activity_materials.find_by(farm_material_id: material_id)
        next unless activity_material
        
        planned_qty = activity_material.planned_quantity
        difference = actual_qty - planned_qty
        material_differences[activity_material.farm_material.name] = difference
        
        unless activity_material.update_actual_quantity(actual_qty)
          return false, "Không thể cập nhật vật tư #{activity_material.farm_material.name}"
        end
      end

      # Cập nhật trạng thái
      activity.update!(status: "completed")
      
      # Gửi thông báo với thông tin vật tư
      @notification_service.activity_completed_with_materials(activity, material_differences)
      
      [true, "Hoạt động đã hoàn thành"]
    end

    # 6. Hủy hoạt động
    def cancel_activity(activity)
      return false, "Không thể hủy hoạt động ở trạng thái này" unless activity.can_cancel?

      case activity.status
      when "pending"
        # Vật tư đã được reserve, sẽ tự động release khi xóa activity_materials
        activity.update!(status: "cancelled")
        return true, "Hoạt động đã được hủy"
        
      when "in_progress"
        # Vật tư đã được commit, giữ nguyên actual_quantity
        activity.update!(status: "cancelled")
        return true, "Hoạt động đã được hủy (vật tư đã sử dụng)"
      end
    end

    # 7. Kiểm tra tổng quan kho vật tư
    def inventory_overview(user)
      materials = FarmMaterial.where(user: user)
      
      overview = {
        total_materials: materials.count,
        low_stock_materials: [],
        reserved_materials: [],
        available_materials: []
      }

      materials.each do |material|
        if material.available_quantity <= 0
          overview[:low_stock_materials] << {
            id: material.id,
            name: material.name,
            available: material.available_quantity,
            reserved: material.reserved_quantity,
            total: material.quantity
          }
        elsif material.reserved_quantity > 0
          overview[:reserved_materials] << {
            id: material.id,
            name: material.name,
            available: material.available_quantity,
            reserved: material.reserved_quantity,
            total: material.quantity
          }
        else
          overview[:available_materials] << {
            id: material.id,
            name: material.name,
            available: material.available_quantity,
            total: material.quantity
          }
        end
      end

      overview
    end

    # 8. Lập báo cáo sử dụng vật tư
    def material_usage_report(user, start_date = 30.days.ago, end_date = Date.today)
      activities = FarmActivity.where(user: user)
                              .where(created_at: start_date..end_date)
                              .includes(:activity_materials => :farm_material)

      report = {
        period: { start: start_date, end: end_date },
        total_activities: activities.count,
        activities_with_materials: activities.joins(:activity_materials).distinct.count,
        material_usage: {}
      }

      activities.each do |activity|
        activity.activity_materials.each do |activity_material|
          material_name = activity_material.farm_material.name
          planned_qty = activity_material.planned_quantity
          actual_qty = activity_material.actual_quantity || 0

          report[:material_usage][material_name] ||= {
            planned_total: 0,
            actual_total: 0,
            efficiency: 0,
            activities_count: 0
          }

          report[:material_usage][material_name][:planned_total] += planned_qty
          report[:material_usage][material_name][:actual_total] += actual_qty
          report[:material_usage][material_name][:activities_count] += 1
        end
      end

      # Tính hiệu quả sử dụng
      report[:material_usage].each do |material_name, data|
        if data[:planned_total] > 0
          data[:efficiency] = ((data[:actual_total] / data[:planned_total]) * 100).round(2)
        end
      end

      report
    end
  end
end 