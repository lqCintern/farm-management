module UseCases::Marketplace
  module ProductOrders
    class GetOrderDetails
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        order = @repository.find_with_associations(id)

        unless order
          return { success: false, error: "Không tìm thấy đơn hàng" }
        end

        # Kiểm tra quyền truy cập
        if order.buyer_id != user_id && order.product_listing.user_id != user_id
          return { success: false, error: "Bạn không có quyền truy cập đơn hàng này" }
        end

        { success: true, order: order }
      end
    end
  end
end
