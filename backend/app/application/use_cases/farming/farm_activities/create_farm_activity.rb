module UseCases::Farming
  module FarmActivities
    class CreateFarmActivity
      def initialize(repository, notification_service)
        @repository = repository
        @notification_service = notification_service
      end

      def execute(attributes, user_id)
        result = @repository.create(attributes, user_id)

        if result.is_a?(Entities::Farming::FarmActivity)
          # Send notification if activity starts soon
          if result.start_date && result.start_date < 7.days.from_now
            @notification_service.activity_reminder(result)
          end

          { success: true, farm_activity: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
