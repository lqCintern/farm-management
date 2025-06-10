module Farming
  module PineappleCrops
    class GenerateFullPlan
      def initialize(pineapple_crop_repository, plan_generator_service)
        @pineapple_crop_repository = pineapple_crop_repository
        @plan_generator_service = plan_generator_service
      end

      def execute(id:, user_id:)
        crop = @pineapple_crop_repository.find(id)

        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền quản lý vụ trồng này" } unless crop.user_id == user_id
        return { success: false, error: "Không thể tạo kế hoạch khi chưa có ngày trồng" } unless crop.planting_date

        # Sử dụng service chuyên biệt để tạo kế hoạch
        activities = @plan_generator_service.generate_activities_for_crop(crop)

        result = @pineapple_crop_repository.save_activities(id, activities, user_id)

        if result[:success]
          updated_crop = @pineapple_crop_repository.find_with_activities(id)
          {
            success: true,
            pineapple_crop: updated_crop,
            message: "Đã tạo kế hoạch trồng dứa thành công"
          }
        else
          { success: false, error: result[:error] }
        end
      end
    end
  end
end
