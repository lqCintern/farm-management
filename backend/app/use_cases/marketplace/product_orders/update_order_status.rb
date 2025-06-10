module Marketplace
  module ProductOrders
    class UpdateOrderStatus
      def initialize(repository, product_repository, transaction_service = nil, notification_service = nil, conversation_service = nil)
        @repository = repository
        @product_repository = product_repository
        @transaction_service = transaction_service || ::Marketplace::TransactionService.new
        @notification_service = notification_service || CleanArch.notification_service
        @conversation_service = conversation_service || ::Marketplace::ConversationService.new
      end

      def execute(order_id, new_status, user_id, reason = nil)
        order = @repository.find_with_associations(order_id)
        
        unless order
          return { success: false, error: "Không tìm thấy đơn hàng" }
        end
        
        old_status = order.status
        
        case new_status
        when "accept"
          result = accept_order(order, user_id)
        when "reject"
          result = reject_order(order, user_id, reason)
        when "complete"
          result = complete_order(order, user_id)
        else
          result = { success: false, error: "Trạng thái không hợp lệ" }
        end
        
        if result[:success]
          # Thêm thông báo cho các bên
          @notification_service.order_status_updated(order_id, old_status)
        end
        
        result
      end
      
      private
      
      def accept_order(order, user_id)
        # Chỉ người bán mới được accept
        unless order.product_listing.user_id == user_id
          return { success: false, error: "Chỉ người bán mới được chấp nhận đơn hàng" }
        end
        
        updated_order = @repository.change_status(order.id, "accepted")
        
        if updated_order
          # Cập nhật trạng thái sản phẩm
          @product_repository.change_status(order.product_listing_id, "sold")
          
          # Từ chối các đơn hàng khác
          @repository.reject_other_orders(
            order.id, 
            order.product_listing_id, 
            "Đơn hàng đã được bán cho người khác"
          )
          
          # Thông báo qua tin nhắn
          send_notification_message(order, user_id, "Tôi đã chấp nhận đơn đặt hàng của bạn!")
          
          { success: true, message: "Đã chấp nhận đơn hàng", status: "accepted", order: updated_order }
        else
          { success: false, error: "Không thể cập nhật trạng thái" }
        end
      end
      
      def reject_order(order, user_id, reason)
        # Chỉ người bán mới được reject
        unless order.product_listing.user_id == user_id
          return { success: false, error: "Chỉ người bán mới được từ chối đơn hàng" }
        end
        
        updated_order = @repository.change_status(order.id, "rejected", reason)
        
        if updated_order
          # Thông báo qua tin nhắn
          reason_text = reason.present? ? "vì: #{reason}" : "vì không đáp ứng được yêu cầu"
          send_notification_message(order, user_id, "Tôi không thể chấp nhận đơn hàng này #{reason_text}")
          
          { success: true, message: "Đã từ chối đơn hàng", status: "rejected", order: updated_order }
        else
          { success: false, error: "Không thể cập nhật trạng thái" }
        end
      end
      
      def complete_order(order, user_id)
        # Cả người mua và người bán đều có thể đánh dấu hoàn thành
        if order.product_listing.user_id != user_id && order.buyer_id != user_id
          return { success: false, error: "Bạn không có quyền với đơn hàng này" }
        end
        
        # Chỉ khi đã accepted thì mới được complete
        unless order.accepted?
          return { success: false, error: "Đơn hàng cần được chấp nhận trước khi hoàn thành" }
        end
        
        updated_order = @repository.change_status(order.id, "completed")
        
        if updated_order
          # Thông báo qua tin nhắn
          notification = user_id == order.buyer_id ?
            "Tôi đã nhận được sản phẩm, cảm ơn bạn!" :
            "Giao dịch đã hoàn tất, cảm ơn bạn!"
            
          send_notification_message(order, user_id, notification)
          
          # Ghi nhận doanh thu
          @transaction_service.create_sale_transaction(updated_order)
          
          { success: true, message: "Đã hoàn thành đơn hàng", status: "completed", order: updated_order }
        else
          { success: false, error: "Không thể cập nhật trạng thái" }
        end
      end
      
      def send_notification_message(order, user_id, message)
        @conversation_service.send_order_notification(order, User.find_by(user_id: user_id), message)
      end
    end
  end
end
