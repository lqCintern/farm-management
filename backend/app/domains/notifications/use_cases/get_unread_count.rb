module Notifications
  module UseCases
  class GetUnreadCount
    def initialize(repository)
      @repository = repository
    end

    def execute(user_id)
      counts = @repository.count_unread(user_id)

      { success: true, counts: counts }
    end
  end
  end
end
