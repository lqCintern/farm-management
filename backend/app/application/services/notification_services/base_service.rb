# app/services/notification/base_service.rb
module Services::NotificationServices
  class BaseService
    attr_reader :subject, :options

    def initialize(subject = nil, options = {})
      @subject = subject
      @options = options
    end

    # Phương thức chung để tạo thông báo
    def create_notification(args)
      # Sử dụng đúng model notification
      notification = Models::Notifications::Notification.create!(args)

      notification
    end

    protected

    # Phương thức trợ giúp để lấy người nhận dự kiến
    def resolve_recipients(recipient_ids)
      return User.where(id: recipient_ids) if recipient_ids.is_a?(Array)
      return [ recipient_ids ] if recipient_ids.is_a?(User)
      return [ recipient_ids.id ] if recipient_ids.respond_to?(:id)
      []
    end
  end
end
