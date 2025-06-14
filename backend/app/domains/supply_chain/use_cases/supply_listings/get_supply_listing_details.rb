module SupplyChain
  module SupplyListings
    class GetSupplyListingDetails
      def initialize(supply_listing_repository)
        @repository = supply_listing_repository
      end
      
      def execute(listing_id)
        # Increment view count first
        @repository.increment_view_count(listing_id)
        
        # Get listing details
        result = @repository.find(listing_id)
        
        if result[:success]
          listing_dto = Dtos::SupplyChain::SupplyListingDto.new(result[:listing], include_details: true)
          { success: true, data: listing_dto }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end