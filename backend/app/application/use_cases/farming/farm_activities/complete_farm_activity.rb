module UseCases::Farming
  module FarmActivities
    class CompleteFarmActivity
      def initialize(repository, notification_service)
        @repository = repository
        @notification_service = notification_service
      end

      def execute(id, completion_params, user_id)
        # Tìm hoạt động
        farm_activity = @repository.find_by_id(id, user_id)
        return { success: false, error: "Không tìm thấy hoạt động" } unless farm_activity

        # Kiểm tra trạng thái
        unless farm_activity.pending?
          return { success: false, error: "Chỉ có thể hoàn thành hoạt động ở trạng thái pending" }
        end

        # Thực hiện complete activity
        result = @repository.complete(id, completion_params, user_id)

        if result[:success]
          # Gửi thông báo
          @notification_service.activity_completed(farm_activity)

          { 
            success: true, 
            farm_activity: result[:farm_activity],
            suggestion: result[:suggestion],
            stage_advance_message: result[:stage_advance_message]
          }
        else
          result # Return error hash
        end
      end
    end
  end
end
