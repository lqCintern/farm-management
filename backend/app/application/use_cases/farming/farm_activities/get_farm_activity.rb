module UseCases::Farming
  module FarmActivities
    class GetFarmActivity
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        farm_activity = @repository.find_by_id(id, user_id)

        if farm_activity
          { success: true, farm_activity: farm_activity }
        else
          { success: false, error: "Không tìm thấy hoạt động" }
        end
      end
    end
  end
end
