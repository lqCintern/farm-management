module Farming
  module PineappleCrops
    class ListPineappleCrops
      def initialize(pineapple_crop_repository, pagination_service)
        @pineapple_crop_repository = pineapple_crop_repository
        @pagination_service = pagination_service
      end

      def execute(user_id:, filters: {}, page: 1, per_page: 10)
        pineapple_crops = @pineapple_crop_repository.find_by_user_id(user_id, filters)

        pagy, paginated_crops = @pagination_service.paginate(
          pineapple_crops,
          page: page,
          items: per_page
        )

        crops_entities = paginated_crops.map { |crop| @pineapple_crop_repository.map_to_entity(crop) }

        [ pagy, crops_entities ]
      end
    end
  end
end
