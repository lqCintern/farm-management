module UseCases::SupplyChain
  module SupplyListings
    class GetSupplyCategories
      def initialize(supply_listing_repository)
        @repository = supply_listing_repository
      end

      def execute
        result = @repository.get_categories

        if result[:success]
          { success: true, data: result[:categories] }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
