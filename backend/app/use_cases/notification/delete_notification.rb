module Notification
  class DeleteNotification
    def initialize(repository)
      @repository = repository
    end
    
    def execute(id, user_id)
      # First verify ownership
      notification = @repository.find(id)
      
      unless notification && notification.recipient_id == user_id
        return { success: false, error: "Unauthorized or not found" }
      end
      
      result = @repository.delete(id)
      
      { success: result }
    end
  end
end
