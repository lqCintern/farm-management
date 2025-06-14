module Notifications
  module UseCases
  class MarkAsUnread
    def initialize(repository)
      @repository = repository
    end

    def execute(id, user_id)
      # First verify ownership
      notification = @repository.find(id)

      unless notification && notification.recipient_id == user_id
        return { success: false, error: "Unauthorized or not found" }
      end

      updated = @repository.mark_as_unread(id)

      if updated
        { success: true, notification: updated }
      else
        { success: false, error: "Failed to mark notification as unread" }
      end
    end
  end
  end
end
