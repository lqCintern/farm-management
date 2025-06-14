module SupplyChain
  module SupplierReviews
    class ListSupplierReviews
      def initialize(repository)
        @repository = repository
      end
      
      def execute(supplier_id, page = 1, per_page = 10)
        result = @repository.find_by_supplier(supplier_id, page, per_page)
        
        if result[:success]
          reviews = result[:reviews].map { |review| Dtos::SupplyChain::SupplierReviewDto.new(review) }
          
          { 
            success: true, 
            data: reviews,
            pagination: result[:pagination]
          }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end