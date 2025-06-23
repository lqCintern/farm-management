module UseCases::Farming
  module PineappleCrops
    class RecordHarvest
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end

      def execute(id:, quantity:, user_id:)
        crop = @pineapple_crop_repository.find(id)

        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền quản lý vụ trồng này" } unless crop.user_id == user_id

        result = @pineapple_crop_repository.record_harvest(id, quantity.to_f)

        if result[:success]
          result[:message] = "Đã ghi nhận thu hoạch thành công"
        end

        result
      end
    end
  end
end
