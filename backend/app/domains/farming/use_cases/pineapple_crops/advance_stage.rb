module Farming
  module PineappleCrops
    class AdvanceStage
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end

      def execute(id:, user_id:)
        crop = @pineapple_crop_repository.find(id)

        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền quản lý vụ trồng này" } unless crop.user_id == user_id

        result = @pineapple_crop_repository.advance_stage(id)

        if result[:success]
          result[:message] = "Đã chuyển sang giai đoạn tiếp theo"
        end

        result
      end
    end
  end
end
