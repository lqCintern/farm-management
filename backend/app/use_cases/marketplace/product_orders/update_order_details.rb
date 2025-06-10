module Marketplace
  module ProductOrders
    class UpdateOrderDetails
      def initialize(repository)
        @repository = repository
      end

      def execute(order_id, attributes, user_id)
        order = @repository.find(order_id)
        
        unless order
          return { success: false, error: "Không tìm thấy đơn hàng" }
        end
        
        # Chỉ người mua và chỉ khi đơn hàng chưa được chấp nhận mới được cập nhật
        if order.buyer_id != user_id
          return { success: false, error: "Chỉ người mua mới được cập nhật đơn hàng" }
        end
        
        unless order.pending?
          return { success: false, error: "Chỉ được cập nhật đơn hàng chưa được xử lý" }
        end
        
        # Cập nhật entity
        updated_entity = Entities::Marketplace::ProductOrder.new(
          id: order_id,
          product_listing_id: order.product_listing_id,
          buyer_id: user_id,
          quantity: attributes[:quantity] || order.quantity,
          price: attributes[:price] || order.price,
          note: attributes[:note] || order.note,
          status: order.status
        )
        
        # Cập nhật qua repository
        updated_order = @repository.update(updated_entity)
        
        if updated_order
          { success: true, message: "Đã cập nhật đơn hàng", order: updated_order }
        else
          { success: false, error: "Không thể cập nhật đơn hàng" }
        end
      end
    end
  end
end
