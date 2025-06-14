module Marketplace
  module MarketplaceHarvests
    class DeleteHarvest
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        # Find existing harvest
        existing = @repository.find(id)

        unless existing
          return { success: false, error: "Không tìm thấy lịch thu hoạch" }
        end

        # Verify ownership
        unless existing.trader_id == user_id
          return { success: false, error: "Bạn không có quyền xóa lịch thu hoạch này" }
        end

        # Delete via repository
        if @repository.delete(id)
          { success: true, message: "Đã xóa lịch thu hoạch thành công" }
        else
          { success: false, error: "Không thể xóa lịch thu hoạch" }
        end
      end
    end
  end
end
