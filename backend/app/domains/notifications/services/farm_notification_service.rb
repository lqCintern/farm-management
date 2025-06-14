# app/services/notification/farm_notification_service.rb
module Notifications
  module Services
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
        return unless harvest.is_a?(Harvest)

        create_notification(
          recipient_id: harvest.user_id,
          sender_id: nil,
          notifiable: harvest,
          category: "farm",
          event_type: "harvest_ready",
          title: "Thu hoạch sẵn sàng",
          message: "Thu hoạch #{harvest.crop_name || 'mùa vụ'} đã sẵn sàng tại #{harvest.field&.name || 'cánh đồng'}",
          metadata: {
            harvest_id: harvest.id,
            field_id: harvest.field_id,
            crop_name: harvest.crop_name,
            estimated_quantity: harvest.estimated_quantity
          },
          priority: 2 # High priority
        )
      end
    end
  end
end
