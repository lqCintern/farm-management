module Notifications
  module UseCases
  class ListNotifications
    def initialize(repository)
      @repository = repository
    end

    def execute(user_id:, category: nil, status: nil, page: 1, per_page: 20)
      pagy, notifications = @repository.list_for_user(user_id, category, status, page, per_page)

      {
        pagy: pagy,
        notifications: notifications
      }
    end
  end
  end
end
