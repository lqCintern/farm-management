module Farming
  module FarmActivities
    class CompleteFarmActivity
      def initialize(repository, notification_service)
        @repository = repository
        @notification_service = notification_service
      end

      def execute(id, completion_params, user_id)
        result = @repository.complete(id, completion_params, user_id)

        if result[:success]
          # Gửi thông báo hoàn thành
          @notification_service.activity_completed(result[:entity])

          {
            success: true,
            farm_activity: result[:entity],
            suggestion: result[:suggestion]
          }
        else
          result # Return error hash
        end
      end
    end
  end
end
