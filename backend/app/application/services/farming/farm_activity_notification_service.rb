module Services::Farming
  class FarmActivityNotificationService
    def activity_reminder(activity, days_before = 7)
      # Thông báo nhắc nhở về hoạt động sắp diễn ra
      user = ::User.find_by(id: activity.user_id)
      return unless user

      ::Notification.create!(
        user_id: activity.user_id,
        title: "Nhắc nhở lịch chăm sóc",
        content: "Hoạt động #{activity_name(activity)} sẽ bắt đầu trong #{days_before} ngày",
        category: "farm_activity",
        status: "unread",
        event_type: "activity_reminder",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    def activity_completed(activity)
      # Thông báo hoạt động đã hoàn thành
      user = ::User.find_by(id: activity.user_id)
      return unless user

      ::Notification.create!(
        user_id: activity.user_id,
        title: "Hoạt động đã hoàn thành",
        content: "Hoạt động #{activity_name(activity)} đã được hoàn thành",
        category: "farm_activity",
        status: "unread",
        event_type: "activity_completed",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    def activity_updated(activity)
      # Thông báo hoạt động đã được cập nhật
      user = Models::User.find_by(id: activity.user_id)
      return unless user

      Models::Notification.create!(
        user_id: activity.user_id,
        title: "Hoạt động đã được cập nhật",
        content: "Hoạt động #{activity_name(activity)} đã được cập nhật",
        category: "farm_activity",
        status: "unread",
        event_type: "activity_updated",
        notifiable_type: "Farming::FarmActivity",
        notifiable_id: activity.id
      )
    end

    def activity_overdue(activity)
      # Thông báo hoạt động quá hạn
      user = ::User.find_by(id: activity.user_id)
      return unless user

      days_overdue = activity.status_details[:overdue_days]

      ::Notification.create!(
        user_id: activity.user_id,
        title: "Hoạt động quá hạn",
        content: "Hoạt động #{activity_name(activity)} đã quá hạn #{days_overdue} ngày",
        category: "farm_activity",
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
