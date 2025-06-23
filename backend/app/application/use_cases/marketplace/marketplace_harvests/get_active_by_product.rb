module UseCases::Marketplace
  module MarketplaceHarvests
    class GetActiveByProduct
      def initialize(repository)
        @repository = repository
      end

      def execute(product_listing_id)
        unless product_listing_id.present?
          return { success: false, error: "Thiếu thông tin sản phẩm" }
        end

        harvest = @repository.active_for_product(product_listing_id)

        if harvest
          { success: true, harvest: harvest }
        else
          { success: false, message: "Không tìm thấy lịch thu hoạch cho sản phẩm này" }
        end
      end
    end
  end
end
