# app/services/notification/delivery_service.rb
module Notifications
  module Services
    class DeliveryService
      attr_reader :notification

      def initialize(notification)
        @notification = notification
      end

      def deliver
        deliver_in_app
        deliver_email
        deliver_push
      end

      private

      def deliver_in_app
        # In-app notification is already created, nothing to do
        true
      end

      def deliver_email
        return unless should_deliver_via?("email")

        # Send email notification
        NotificationMailer.notification_email(notification).deliver_later

        # Update delivery status
        notification.update(sent_via_email_at: Time.current)
      end

      def deliver_push
        return unless should_deliver_via?("push")

        # Send push notification using Firebase
        if defined?(FirebaseService) && notification.recipient.device_tokens.present?
          begin
            firebase_data = {
              title: notification.title,
              body: notification.message,
              data: {
                notification_id: notification.id,
                category: notification.category,
                event_type: notification.event_type,
                action_url: notification.display_data[:action_url]
              }
            }

            FirebaseService.new.send_notification(
              notification.recipient.device_tokens,
              firebase_data
            )

            notification.update(sent_via_push_at: Time.current)
          rescue => e
            Rails.logger.error("Failed to send push notification: #{e.message}")
          end
        end
      end

      def should_deliver_via?(channel)
        return false if channel.blank?

        # Kiểm tra cài đặt thông báo của người dùng
        NotificationSetting.user_enabled_channel?(
          notification.recipient_id,
          notification.category,
          notification.event_type,
          channel
        )
      end
    end
  end
end