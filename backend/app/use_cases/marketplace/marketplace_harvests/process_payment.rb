module Marketplace
  module MarketplaceHarvests
    class ProcessPayment
      def initialize(repository)
        @repository = repository
      end

      def execute(id, payment_proof, user_id)
        # Find existing harvest
        existing = @repository.find(id)
        
        unless existing
          return { success: false, error: "Không tìm thấy lịch thu hoạch" }
        end
        
        # Verify ownership
        unless existing.trader_id == user_id
          return { success: false, error: "Bạn không có quyền cập nhật bằng chứng thanh toán" }
        end
        
        # Save payment proof
        result = @repository.add_payment_proof(id, payment_proof)
        
        if result
          { success: true, harvest: result, message: "Đã cập nhật bằng chứng thanh toán thành công" }
        else
          { success: false, error: "Không thể cập nhật bằng chứng thanh toán" }
        end
      end
    end
  end
end
