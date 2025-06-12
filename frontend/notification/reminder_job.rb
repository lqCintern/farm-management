# # app/jobs/notification/reminder_job.rb
# module NotificationJob
#   class ReminderJob < ApplicationJob
#     queue_as :notifications

#     def perform
#       # 1. Nhắc nhở hoạt động nông trại sắp tới
#       remind_farm_activities

#       # 2. Cảnh báo hoạt động quá hạn
#       check_overdue_activities

#       # 3. Nhắc nhở phân công lao động ngày mai
#       remind_labor_assignments

#       # 4. Nhắc nhở đánh giá vật tư đã nhận
#       remind_supply_reviews
#     end

#     private

#     def remind_farm_activities
#       # Tìm các hoạt động diễn ra trong vòng 1 ngày tới (chưa bị nhắc nhở trong vòng 24h qua)
#       tomorrow = Date.tomorrow.beginning_of_day
#       tomorrow_end = Date.tomorrow.end_of_day

#       Farming::FarmActivity.includes(:user, :field)
#                   .where("start_date BETWEEN ? AND ?", tomorrow, tomorrow_end)
#                   .where(status: [ "pending", "in_progress" ])
#                   .find_each do |activity|
#         # Kiểm tra xem đã nhắc nhở trong vòng 24h chưa
#         last_reminder = Notification.where(
#           notifiable_type: "FarmActivity",
#           notifiable_id: activity.id,
#           event_type: "activity_reminder"
#         ).where("created_at > ?", 24.hours.ago).exists?

#         unless last_reminder
#           Notification::FarmNotificationService.new.activity_reminder(activity, 1)
#         end
#       end
#     end

#     def check_overdue_activities
#       # Tìm các hoạt động đã quá hạn nhưng chưa hoàn thành
#       yesterday = Date.yesterday.end_of_day

#       Farming::FarmActivity.includes(:user, :field)
#                   .where("end_date < ?", yesterday)
#                   .where.not(status: "completed")
#                   .find_each do |activity|
#         # Kiểm tra xem đã cảnh báo trong vòng 24h chưa
#         last_alert = Notification.where(
#           notifiable_type: "FarmActivity",
#           notifiable_id: activity.id,
#           event_type: "activity_overdue"
#         ).where("created_at > ?", 24.hours.ago).exists?

#         unless last_alert
#           Notification::FarmNotificationService.new.activity_overdue(activity)
#         end
#       end
#     end

#     def remind_labor_assignments
#       # Tìm các phân công lao động diễn ra vào ngày mai
#       tomorrow = Date.tomorrow.beginning_of_day
#       tomorrow_end = Date.tomorrow.end_of_day

#       Labor::LaborAssignment.includes(:worker, :labor_request)
#                              .where("start_date BETWEEN ? AND ?", tomorrow, tomorrow_end)
#                              .where(status: "pending")
#                              .find_each do |assignment|
#         # Kiểm tra xem đã nhắc nhở trong vòng 24h chưa
#         last_reminder = Notification.where(
#           notifiable_type: "Labor::LaborAssignment",
#           notifiable_id: assignment.id,
#           event_type: "assignment_reminder"
#         ).where("created_at > ?", 24.hours.ago).exists?

#         unless last_reminder
#           Notification::LaborNotificationService.new.assignment_reminder(assignment)
#         end
#       end
#     end

#     def remind_supply_reviews
#       # Tìm các đơn hàng vật tư đã hoàn thành trong 7 ngày qua và chưa có đánh giá
#       one_week_ago = 7.days.ago

#       SupplyOrder.includes(:user, :supply_listing)
#                  .where(status: "completed")
#                  .where("updated_at BETWEEN ? AND ?", one_week_ago, Time.now)
#                  .find_each do |order|
#         # Kiểm tra xem đã có đánh giá chưa
#         has_review = order.respond_to?(:supplier_reviews) && order.supplier_reviews.exists?

#         # Kiểm tra xem đã nhắc nhở trong vòng 3 ngày chưa
#         last_reminder = Notification.where(
#           notifiable_type: "SupplyOrder",
#           notifiable_id: order.id,
#           event_type: "review_reminder"
#         ).where("created_at > ?", 3.days.ago).exists?

#         unless has_review || last_reminder
#           Notification::SupplyNotificationService.new.review_reminder(order)
#         end
#       end
#     end
#   end
# end
