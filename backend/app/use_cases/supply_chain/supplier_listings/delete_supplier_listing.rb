module SupplyChain
  module SupplierListings
    class DeleteSupplierListing
      def initialize(repository)
        @repository = repository
      end
      
      def execute(listing_id, user_id)
        # Verify ownership
        find_result = @repository.find_by_id_and_user(listing_id, user_id)
        return { success: false, errors: ["Không tìm thấy vật tư"] } unless find_result[:success]
        
        result = @repository.delete(listing_id)
        
        if result[:success]
          { success: true, message: "Xóa vật tư thành công" }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
