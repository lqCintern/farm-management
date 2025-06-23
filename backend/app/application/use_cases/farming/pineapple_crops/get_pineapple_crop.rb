module UseCases::Farming
  module PineappleCrops
    class GetPineappleCrop
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end

      def execute(id)
        pineapple_crop = @pineapple_crop_repository.find_with_activities(id)

        if pineapple_crop
          { success: true, pineapple_crop: pineapple_crop }
        else
          { success: false, error: "Không tìm thấy vụ trồng dứa" }
        end
      end
    end
  end
end
