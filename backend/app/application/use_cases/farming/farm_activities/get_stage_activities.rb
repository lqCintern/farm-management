module UseCases::Farming
  module FarmActivities
    class GetStageActivities
      def initialize(repository)
        @repository = repository
      end

      def execute(crop_id, user_id, current_stage_only = false)
        activities = @repository.find_by_stage(crop_id, user_id, current_stage_only)

        if activities
          { success: true, activities: activities }
        else
          { success: false, error: "Không thể lấy danh sách hoạt động" }
        end
      end
    end
  end
end
