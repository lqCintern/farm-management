module UseCases::Farming
  module PineappleCrops
    class DeletePineappleCrop
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end

      def execute(id:, user_id:)
        crop = @pineapple_crop_repository.find(id)

        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền xóa vụ trồng này" } unless crop.user_id == user_id

        if @pineapple_crop_repository.delete(id)
          { success: true, message: "Đã xóa vụ trồng dứa thành công" }
        else
          { success: false, error: "Không thể xóa vụ trồng dứa" }
        end
      end
    end
  end
end
