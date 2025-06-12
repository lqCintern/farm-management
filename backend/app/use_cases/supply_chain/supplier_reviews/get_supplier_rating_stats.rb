module SupplyChain
  module SupplierReviews
    class GetSupplierRatingStats
      def initialize(repository, user_repository)
        @repository = repository
        @user_repository = user_repository
      end
      
      def execute(supplier_id)
        # Get supplier info
        supplier = @user_repository.find_by_id(supplier_id)
        return { success: false, errors: ["Không tìm thấy nhà cung cấp"] } unless supplier
        
        # Get rating stats
        result = @repository.get_supplier_rating_stats(supplier_id)
        
        if result[:success]
          { 
            success: true, 
            data: {
              supplier: {
                id: supplier.user_id,
                name: supplier.user_name
              },
              stats: result[:stats]
            }
          }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end