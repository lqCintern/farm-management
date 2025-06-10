module Marketplace
  module MarketplaceHarvests
    class UpdateHarvest
      def initialize(repository)
        @repository = repository
      end

      def execute(id, attributes, user_id)
        # Find existing harvest
        existing = @repository.find(id)

        unless existing
          return { success: false, error: "Không tìm thấy lịch thu hoạch" }
        end

        # Verify ownership
        unless existing.trader_id == user_id
          return { success: false, error: "Bạn không có quyền cập nhật lịch thu hoạch này" }
        end

        # Create updated entity
        updated_entity = Entities::Marketplace::MarketplaceHarvest.new(
          attributes.merge(id: id, trader_id: user_id)
        )

        # Update via repository
        result = @repository.update(updated_entity)

        if result
          { success: true, harvest: result, message: "Đã cập nhật lịch thu hoạch thành công" }
        else
          { success: false, error: "Không thể cập nhật lịch thu hoạch" }
        end
      end
    end
  end
end
