# app/services/notification/farm_notification_service.rb
module Services::NotificationServices
  class FarmNotificationService < BaseService
    # Thông báo nhắc nhở hoạt động sắp tới
    def activity_reminder(activity, days_before = 1)
      return unless activity.is_a?(FarmActivity)

      # Người nhận là chủ nông trại và những người được phân công
      recipients = [ activity.user ]

      if activity.respond_to?(:assignments) && activity.assignments.any?
        recipients += activity.assignments.map(&:worker).map(&:user).compact
      end

      recipients.uniq.compact.each do |recipient|
        create_notification(
          recipient_id: recipient.id,
          sender_id: nil, # System notification
          notifiable: activity,
          category: "farm",
          event_type: "activity_reminder",
          title: "Nhắc nhở: #{activity.description}",
          message: "Hoạt động #{activity.description} sẽ diễn ra vào ngày #{activity.start_date.strftime('%d/%m/%Y')}",
          metadata: {
            days_before: days_before,
            activity_id: activity.id,
            field_id: activity.field_id,
            field_name: activity.field&.name || "N/A",
            start_date: activity.start_date
          }
        )
      end
    end

    # Thông báo khi hoạt động quá hạn
    def activity_overdue(activity)
      return unless activity.is_a?(FarmActivity) && activity.status != "completed"

      create_notification(
        recipient_id: activity.user_id,
        sender_id: nil,
        notifiable: activity,
        category: "farm",
        event_type: "activity_overdue",
        title: "Quá hạn: #{activity.description}",
        message: "Hoạt động #{activity.description} đã quá hạn #{(Date.today - activity.end_date.to_date).to_i} ngày",
        metadata: {
          activity_id: activity.id,
          field_id: activity.field_id,
          field_name: activity.field&.name || "N/A",
          days_overdue: (Date.today - activity.end_date.to_date).to_i
        },
        priority: 2 # High priority
      )
    end

    # Thông báo mùa vụ chuyển giai đoạn
    def crop_stage_changed(crop, old_stage, new_stage)
      return unless crop.is_a?(PineappleCrop)

      create_notification(
        recipient_id: crop.user_id,
        sender_id: nil,
        notifiable: crop,
        category: "farm",
        event_type: "crop_stage_changed",
        title: "Mùa vụ đã chuyển giai đoạn",
        message: "Mùa vụ #{crop.name} đã chuyển từ giai đoạn #{old_stage} sang #{new_stage}",
        metadata: {
          crop_id: crop.id,
          field_id: crop.field_id,
          field_name: crop.field&.name || "N/A",
          old_stage: old_stage,
          new_stage: new_stage
        }
      )
    end

    # Thông báo thu hoạch sẵn sàng
    def harvest_ready(harvest)
      return unless harvest.is_a?(PineappleCrop)

      create_notification(
        recipient_id: harvest.user_id,
        sender_id: nil,
        notifiable: harvest,
        category: "farm",
        event_type: "harvest_ready",
        title: "Thu hoạch sẵn sàng",
        message: "Thu hoạch #{harvest.name} đã sẵn sàng tại #{harvest.field&.name || 'cánh đồng'}",
        metadata: {
          crop_id: harvest.id,
          field_id: harvest.field_id,
          field_name: harvest.field&.name || "N/A",
          estimated_quantity: harvest.estimated_quantity
        },
        priority: 2 # High priority
      )
    end

    # Thông báo thiếu vật tư khi lập kế hoạch
    def material_insufficient(activity, insufficient_materials)
      return unless activity.is_a?(FarmActivity)

      create_notification(
        recipient_id: activity.user_id,
        sender_id: nil,
        notifiable: activity,
        category: "farm",
        event_type: "material_insufficient",
        title: "Thiếu vật tư cho hoạt động",
        message: "Hoạt động #{activity.description} thiếu vật tư: #{insufficient_materials.join(', ')}",
        metadata: {
          activity_id: activity.id,
          field_id: activity.field_id,
          field_name: activity.field&.name || "N/A",
          insufficient_materials: insufficient_materials,
          start_date: activity.start_date
        },
        priority: 2 # High priority
      )
    end

    # Thông báo khi bắt đầu hoạt động
    def activity_started(activity)
      return unless activity.is_a?(FarmActivity)

      create_notification(
        recipient_id: activity.user_id,
        sender_id: nil,
        notifiable: activity,
        category: "farm",
        event_type: "activity_started",
        title: "Hoạt động đã bắt đầu",
        message: "Hoạt động #{activity.description} đã bắt đầu thực hiện",
        metadata: {
          activity_id: activity.id,
          field_id: activity.field_id,
          field_name: activity.field&.name || "N/A",
          start_date: activity.start_date,
          materials_used: activity.activity_materials.map { |am| "#{am.farm_material.name}: #{am.planned_quantity}" }
        }
      )
    end

    # Thông báo khi hoàn thành hoạt động với thông tin vật tư
    def activity_completed_with_materials(activity, material_differences = {})
      return unless activity.is_a?(FarmActivity)

      message = "Hoạt động #{activity.description} đã hoàn thành"
      
      if material_differences.any?
        differences = material_differences.map do |material_name, diff|
          if diff > 0
            "#{material_name}: dùng thêm #{diff}"
          elsif diff < 0
            "#{material_name}: tiết kiệm #{diff.abs}"
          end
        end.compact
        
        message += ". Vật tư: #{differences.join(', ')}" if differences.any?
      end

      create_notification(
        recipient_id: activity.user_id,
        sender_id: nil,
        notifiable: activity,
        category: "farm",
        event_type: "activity_completed",
        title: "Hoạt động đã hoàn thành",
        message: message,
        metadata: {
          activity_id: activity.id,
          field_id: activity.field_id,
          field_name: activity.field&.name || "N/A",
          completion_date: Time.current,
          material_differences: material_differences
        }
      )
    end

    # Thông báo nhắc nhở kiểm tra vật tư trước ngày thực hiện
    def material_check_reminder(activity, days_before = 1)
      return unless activity.is_a?(FarmActivity) && activity.requires_materials?

      insufficient_materials = []
      activity.activity_materials.each do |material|
        unless material.can_commit?
          insufficient_materials << material.farm_material.name
        end
      end

      if insufficient_materials.any?
        create_notification(
          recipient_id: activity.user_id,
          sender_id: nil,
          notifiable: activity,
          category: "farm",
          event_type: "material_check_reminder",
          title: "Nhắc nhở: Thiếu vật tư cho hoạt động",
          message: "Hoạt động #{activity.description} sẽ diễn ra trong #{days_before} ngày nhưng thiếu vật tư: #{insufficient_materials.join(', ')}",
          metadata: {
            activity_id: activity.id,
            field_id: activity.field_id,
            field_name: activity.field&.name || "N/A",
            insufficient_materials: insufficient_materials,
            start_date: activity.start_date,
            days_before: days_before
          },
          priority: 2 # High priority
        )
      end
    end
  end
end
