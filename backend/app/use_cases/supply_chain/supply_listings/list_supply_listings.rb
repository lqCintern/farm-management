module SupplyChain
  module SupplyListings
    class ListSupplyListings
      def initialize(supply_listing_repository)
        @repository = supply_listing_repository
      end
      
      def execute(filters = {}, page = 1, per_page = 15)
        result = @repository.find_all(filters, page, per_page)
        
        if result[:success]
          listings = result[:listings]
          pagination = Dtos::SupplyChain::PaginationDto.new(
            result[:pagination][:total_pages],
            result[:pagination][:current_page],
            result[:pagination][:total_count],
            result[:pagination][:per_page]
          )
          
          listing_dtos = listings.map { |listing| Dtos::SupplyChain::SupplyListingDto.new(listing) }
          
          {
            success: true,
            data: {
              listings: listing_dtos,
              pagination: pagination
            }
          }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end