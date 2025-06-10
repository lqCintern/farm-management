module Marketplace
  module MarketplaceHarvests
    class CreateHarvest
      def initialize(repository, product_repository)
        @repository = repository
        @product_repository = product_repository
      end

      def execute(attributes, user_id, product_listing_id)
        # Validate product listing exists
        product = @product_repository.find(product_listing_id)
        unless product
          return { success: false, error: "Không tìm thấy sản phẩm" }
        end

        # Check if there's already an active harvest for this product
        if @repository.active_for_product(product_listing_id).present?
          return {
            success: false,
            error: "Đã có lịch thu hoạch khác đang diễn ra cho sản phẩm này"
          }
        end

        # Create entity
        harvest_entity = Entities::Marketplace::MarketplaceHarvest.new(
          attributes.merge(
            trader_id: user_id,
            product_listing_id: product_listing_id,
            status: "scheduled"
          )
        )

        # Save via repository
        result = @repository.create(harvest_entity)

        if result
          { success: true, harvest: result, message: "Đã lên lịch thu hoạch thành công" }
        else
          { success: false, error: "Không thể tạo lịch thu hoạch" }
        end
      end
    end
  end
end
