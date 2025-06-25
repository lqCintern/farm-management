module Services::Farming
  class FarmActivityNotificationService
    def activity_reminder(activity, days_before = 7)
      # Thông báo nhắc nhở về hoạt động sắp diễn ra
      user = Models::User.find_by(user_id: activity.user_id)
      return unless user

      Models::Notifications::Notification.create!(
        recipient_id: activity.user_id,  # Thay user_id bằng recipient_id
        title: "Nhắc nhở lịch chăm sóc",
        message: "Hoạt động #{activity_name(activity)} sẽ bắt đầu trong #{days_before} ngày",  # Thay content bằng message
        category: "farm",
        event_type: "activity_reminder",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    def activity_completed(activity)
      # Thông báo hoạt động đã hoàn thành
      user = Models::User.find_by(user_id: activity.user_id)
      return unless user

      Models::Notifications::Notification.create!(
        recipient_id: activity.user_id,  # Thay user_id bằng recipient_id
        title: "Hoạt động đã hoàn thành",
        message: "Hoạt động #{activity_name(activity)} đã được hoàn thành",  # Thay content bằng message
        category: "farm",
        status: "unread",
        event_type: "activity_completed",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    def activity_updated(activity)
      # Thông báo hoạt động đã được cập nhật
      user = Models::User.find_by(user_id: activity.user_id)
      return unless user

      Models::Notifications::Notification.create!(
        recipient_id: activity.user_id,  # Thay user_id bằng recipient_id
        title: "Hoạt động đã được cập nhật",
        message: "Hoạt động #{activity_name(activity)} đã được cập nhật",  # Thay content bằng message
        category: "farm",
        status: "unread",
        event_type: "activity_updated",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    def activity_overdue(activity)
      # Thông báo hoạt động quá hạn
      user = Models::User.find_by(user_id: activity.user_id)
      return unless user

      days_overdue = activity.status_details[:overdue_days]

      Models::Notifications::Notification.create!(
        recipient_id: activity.user_id,  # Thay user_id bằng recipient_id
        title: "Hoạt động quá hạn",
        message: "Hoạt động #{activity_name(activity)} đã quá hạn #{days_overdue} ngày",  # Thay content bằng message
        category: "farm",
        status: "unread",
        event_type: "activity_overdue",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    private

    def activity_name(activity)
      "#{I18n.t("farming.activity_types.#{activity.activity_type}")}: #{activity.description}"
    rescue
      activity.description || activity.activity_type.to_s.humanize
    end
  end
end
