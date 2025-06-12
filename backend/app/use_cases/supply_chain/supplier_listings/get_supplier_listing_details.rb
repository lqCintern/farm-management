module SupplyChain
  module SupplierListings
    class GetSupplierListingDetails
      def initialize(repository)
        @repository = repository
      end
      
      def execute(listing_id, user_id)
        result = @repository.find_by_id_and_user(listing_id, user_id)
        
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
