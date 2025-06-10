module Notification
  class GetNotificationDetails
    def initialize(repository)
      @repository = repository
    end
    
    def execute(id, user_id)
      notification = @repository.find(id)
      
      unless notification
        return { success: false, error: "Notification not found" }
      end
      
      # Ensure user can only access their notifications
      unless notification.recipient_id == user_id
        return { success: false, error: "Unauthorized" }
      end
      
      { success: true, notification: notification }
    end
  end
end
