require_relative "base_service"

module Notifications
  module Services
    class LaborNotificationService < BaseService
      # Thông báo yêu cầu đổi công mới
      def new_labor_request(request)
        return unless request.is_a?(Labor::LaborRequest)

        # Xác định người nhận
        recipient = request.providing_household&.owner
        return unless recipient

        create_notification(
          recipient_id: recipient.id,
          sender_id: request.requesting_household.owner_id,
          notifiable: request,
          category: "labor",
          event_type: "new_request",
          title: "Yêu cầu đổi công mới",
          message: "#{request.requesting_household.name} đã gửi yêu cầu đổi công: #{request.title}",
          metadata: {
            request_id: request.id,
            request_title: request.title,
            requesting_household_id: request.requesting_household_id,
            requesting_household_name: request.requesting_household.name,
            start_date: request.start_date,
            end_date: request.end_date
          }
        )
      end

      # Thông báo phản hồi yêu cầu đổi công
      def labor_request_response(request, status)
        return unless request.is_a?(Labor::LaborRequest)

        # Người nhận là người tạo yêu cầu
        recipient = request.requesting_household.owner
        sender = request.providing_household&.owner

        title = case status
        when "accepted" then "Yêu cầu đổi công được chấp nhận"
        when "rejected" then "Yêu cầu đổi công bị từ chối"
        else "Cập nhật yêu cầu đổi công"
        end

        message = case status
        when "accepted"
                    "#{request.providing_household.name} đã chấp nhận yêu cầu đổi công: #{request.title}"
        when "rejected"
                    "#{request.providing_household.name} đã từ chối yêu cầu đổi công: #{request.title}"
        else
                    "Có cập nhật về yêu cầu đổi công: #{request.title}"
        end

        create_notification(
          recipient_id: recipient.id,
          sender_id: sender&.id,
          notifiable: request,
          category: "labor",
          event_type: "request_updated",
          title: title,
          message: message,
          metadata: {
            request_id: request.id,
            request_title: request.title,
            status: status,
            providing_household_id: request.providing_household_id,
            providing_household_name: request.providing_household&.name
          },
          priority: status == "accepted" ? 1 : 2 # Từ chối là ưu tiên cao hơn
        )
      end

      # Thông báo phân công lao động mới
      def new_assignment(assignment)
        return unless assignment.is_a?(Labor::LaborAssignment)

        # Thông báo cho người lao động
        worker_user = assignment.worker&.user
        return unless worker_user

        create_notification(
          recipient_id: worker_user.id,
          sender_id: assignment.assigner_id,
          notifiable: assignment,
          category: "labor",
          event_type: "assignment_created",
          title: "Phân công lao động mới",
          message: "Bạn đã được phân công cho hoạt động: #{assignment.labor_request&.title || 'Không tiêu đề'}",
          metadata: {
            assignment_id: assignment.id,
            request_id: assignment.labor_request_id,
            request_title: assignment.labor_request&.title,
            start_date: assignment.start_date,
            end_date: assignment.end_date,
            role: assignment.role,
            notes: assignment.notes
          }
        )
      end

      # Nhắc nhở lịch làm việc
      def assignment_reminder(assignment)
        return unless assignment.is_a?(Labor::LaborAssignment)

        worker_user = assignment.worker&.user
        return unless worker_user

        create_notification(
          recipient_id: worker_user.id,
          sender_id: nil,
          notifiable: assignment,
          category: "labor",
          event_type: "assignment_reminder",
          title: "Nhắc nhở lịch làm việc",
          message: "Nhắc nhở: Bạn có lịch làm việc vào ngày mai cho #{assignment.labor_request&.title || 'công việc'}",
          metadata: {
            assignment_id: assignment.id,
            request_id: assignment.labor_request_id,
            request_title: assignment.labor_request&.title,
            start_date: assignment.start_date,
            location: assignment.labor_request&.location
          }
        )
      end
    end
  end
end