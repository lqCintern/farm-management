module Notification
  class MarkAllAsRead
    def initialize(repository)
      @repository = repository
    end

    def execute(user_id, category = nil)
      count = @repository.mark_all_as_read(user_id, category)

      { success: true, count: count }
    end
  end
end
