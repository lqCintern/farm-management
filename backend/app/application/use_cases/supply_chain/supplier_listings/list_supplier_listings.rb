module UseCases::SupplyChain
  module SupplierListings
    class ListSupplierListings
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id)
        result = @repository.find_by_user_id(user_id)

        if result[:success]
          listings = result[:listings].map { |listing| Dtos::SupplyChain::SupplyListingDto.new(listing) }
          { success: true, data: listings }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
