module Farming
  module PineappleCrops
    class PreviewPlan
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end

      def execute(crop_params)
        @pineapple_crop_repository.preview_plan(crop_params)
      end
    end
  end
end
