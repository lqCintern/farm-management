# # app/jobs/notification/delivery_job.rb
# module NotificationJob
#   class DeliveryJob < ApplicationJob
#     queue_as :notifications

#     def perform(notification_id)
#       notification = ::Notification.find_by(id: notification_id)
#       return unless notification

#       delivery_service = DeliveryService.new(notification)
#       delivery_service.deliver
#     end
#   end
# end
