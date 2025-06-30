module UseCases::Marketplace
  module MarketplaceHarvests
    class CreateHarvest
      def initialize(repository, product_repository)
        @repository = repository
        @product_repository = product_repository
      end

      def execute(attributes, user_id, product_listing_id, trader_id = nil)
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

        # Determine trader_id based on parameters
        # If trader_id is provided in parameters, use it (current user is farmer)
        # Otherwise, use current user_id (current user is trader)
        final_trader_id = trader_id || user_id

        # Create entity
        harvest_entity = Entities::Marketplace::MarketplaceHarvest.new(
          attributes.merge(
            trader_id: final_trader_id,
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

      def create_from_order(order)
        field_name = order.product_listing&.pineapple_crop&.field&.name rescue nil
        location_text = order.product_listing&.location_text rescue nil
        location = field_name.presence || location_text.presence || "Chưa xác định"
        product_title = order.product_listing&.title || "Sản phẩm"

        # Sử dụng khối lượng (kg) thay vì số quả
        harvest_attributes = {
          scheduled_date: order.created_at,
          actual_quantity: order.total_weight, # kg
          estimated_quantity: order.total_weight, # kg
          notes: "Thu hoạch tự động từ đơn hàng ##{order.id} - #{product_title}",
          status: "completed",
          trader_id: order.buyer_id,
          product_listing_id: order.product_listing_id,
          product_order_id: order.id,
          location: location
        }

        harvest_entity = Entities::Marketplace::MarketplaceHarvest.new(harvest_attributes)
        result = @repository.create(harvest_entity)

        if result
          Rails.logger.info("Created MarketplaceHarvest from completed order #{order.id}: #{result.id}")
          { success: true, harvest: result }
        else
          Rails.logger.error("Failed to create MarketplaceHarvest from order #{order.id}")
          { success: false, error: "Không thể tạo bản ghi thu hoạch" }
        end
      end
    end
  end
end
