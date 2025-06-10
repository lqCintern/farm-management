module Farming
  module PineappleCrops
    class CleanActivities
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end
      
      def execute(id:, user_id:)
        crop = @pineapple_crop_repository.find(id)
        
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless crop
        return { success: false, error: "Bạn không có quyền quản lý vụ trồng này" } unless crop.user_id == user_id
        
        @pineapple_crop_repository.clean_and_regenerate(id, user_id)
      end
    end
  end
end
