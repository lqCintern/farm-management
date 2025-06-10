module Farming
  module FarmActivities
    class DeleteFarmActivity
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        # Kiểm tra hoạt động hiện tại
        current_activity = @repository.find_by_id(id, user_id)
        return { success: false, error: "Không tìm thấy hoạt động" } unless current_activity

        # Kiểm tra xem hoạt động đã hoàn thành chưa
        if current_activity.completed?
          return { success: false, error: "Không thể xóa hoạt động đã hoàn thành" }
        end

        # Thực hiện xóa
        @repository.delete(id, user_id)
      end
    end
  end
end
