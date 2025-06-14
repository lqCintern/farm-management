module Farming
  module PineappleCrops
    class UpdatePineappleCrop
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end

      def execute(id:, attributes:, user_id:)
        # Validate ownership
        crop = @pineapple_crop_repository.find(id)

        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền chỉnh sửa vụ trồng này" } unless crop.user_id == user_id

        # Update crop
        result = @pineapple_crop_repository.update(id, attributes)

        if result[:success] && (attributes[:planting_date].present? || attributes[:season_type].present?)
          # Recalculate key dates if planting date or season changed
          @pineapple_crop_repository.calculate_key_dates(result[:pineapple_crop])
        end

        result
      end
    end
  end
end
