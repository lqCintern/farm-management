module SupplyChain
  module SupplierListings
    class ChangeSupplierListingStatus
      def initialize(repository)
        @repository = repository
      end
      
      def execute(listing_id, user_id, status)
        # Verify ownership
        find_result = @repository.find_by_id_and_user(listing_id, user_id)
        return { success: false, errors: ["Không tìm thấy vật tư"] } unless find_result[:success]
        
        result = @repository.update(listing_id, { status: status })
        
        if result[:success]
          { success: true, data: { status: result[:listing].status }, message: "Cập nhật trạng thái thành công" }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end