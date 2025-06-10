module Farming
  module PineappleCrops
    class GeneratePineapplePlan
      def initialize(pineapple_crop_repository, plan_generator_service)
        @pineapple_crop_repository = pineapple_crop_repository
        @plan_generator_service = plan_generator_service
      end
      
      def execute(id:, user_id:)
        crop = @pineapple_crop_repository.find(id)
        
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền quản lý vụ trồng này" } unless crop.user_id == user_id
        return { success: false, error: "Không thể tạo kế hoạch khi chưa có ngày trồng" } unless crop.planting_date.present?
        
        # Tạo danh sách hoạt động sử dụng PlanGeneratorService
        activities = @plan_generator_service.generate_activities_for_crop(crop)
        
        # Gọi repository để lưu các hoạt động
        @pineapple_crop_repository.generate_plan(id, activities)
      end
    end
  end
end
