class NotificationService
  def self.send_activity_reminders
    # Lấy tất cả hoạt động diễn ra vào ngày mai hoặc hôm nay
    tomorrow = Date.tomorrow
    today = Date.today
    
    activities_tomorrow = FarmActivity.where(start_date: tomorrow, status: :pending)
    activities_today = FarmActivity.where(start_date: today, status: :pending)
    
    # Gửi thông báo cho hoạt động ngày mai
    activities_tomorrow.each do |activity|
      NotificationMailer.with(user: activity.user, activity: activity, days_before: 1).reminder_email.deliver_later
      create_in_app_notification(activity, 1)
    end
    
    # Gửi thông báo cho hoạt động hôm nay
    activities_today.each do |activity|
      NotificationMailer.with(user: activity.user, activity: activity, days_before: 0).reminder_email.deliver_later
      create_in_app_notification(activity, 0)
    end
  end
  
  private
  
  def self.create_in_app_notification(activity, days_before)
    message = if days_before == 0
                "Bạn có lịch \"#{activity.activity_type}\" cần thực hiện hôm nay"
              else
                "Bạn có lịch \"#{activity.activity_type}\" vào ngày mai"
              end
              
    Notification.create!(
      user: activity.user,
      message: message,
      related_type: 'FarmActivity',
      related_id: activity.id,
      is_read: false
    )
  end
end