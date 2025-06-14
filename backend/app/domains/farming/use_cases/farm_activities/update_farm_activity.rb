module Farming
  module FarmActivities
    class UpdateFarmActivity
      def initialize(repository, notification_service)
        @repository = repository
        @notification_service = notification_service
      end

      def execute(id, attributes, user_id)
        # Kiểm tra hoạt động hiện tại
        current_activity = @repository.find_by_id(id, user_id)
        return { success: false, error: "Không tìm thấy hoạt động" } unless current_activity

        # Kiểm tra xem hoạt động đã hoàn thành chưa
        if current_activity.completed?
          return { success: false, error: "Không thể chỉnh sửa hoạt động đã hoàn thành" }
        end

        # Thực hiện cập nhật
        result = @repository.update(id, attributes, user_id)

        if result.is_a?(Entities::Farming::FarmActivity)
          # Xử lý thông báo nếu cần
          @notification_service.activity_updated(result)

          { success: true, farm_activity: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
