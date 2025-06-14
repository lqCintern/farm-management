# app/services/notification/marketplace_notification_service.rb
module NotificationServices
  class MarketplaceNotificationService < BaseService
    # Thông báo đơn hàng mới
    def new_order(order)
      return unless order.is_a?(ProductOrder)

      # Người bán nhận thông báo
      seller = order.product_listing&.user
      return unless seller

      create_notification(
        recipient_id: seller.id,
        sender_id: order.user_id,
        notifiable: order,
        category: "marketplace",
        event_type: "new_order",
        title: "Đơn hàng mới",
        message: "Bạn có đơn hàng mới cho #{order.product_listing&.name}",
        metadata: {
          order_id: order.id,
          product_id: order.product_listing_id,
          product_name: order.product_listing&.name,
          quantity: order.quantity,
          total_price: order.total_price,
          buyer_name: order.user&.name
        }
      )
    end

    # Thông báo cập nhật trạng thái đơn hàng
    def order_status_updated(order, old_status)
      return unless order.is_a?(ProductOrder)

      # Người mua nhận thông báo
      buyer = order.user

      status_text = case order.status
      when "accepted" then "đã được chấp nhận"
      when "shipped" then "đang được vận chuyển"
      when "completed" then "đã hoàn thành"
      when "cancelled" then "đã bị hủy"
      else "đã được cập nhật"
      end

      create_notification(
        recipient_id: buyer.id,
        sender_id: order.product_listing&.user_id,
        notifiable: order,
        category: "marketplace",
        event_type: "order_updated",
        title: "Cập nhật đơn hàng",
        message: "Đơn hàng #{order.id} #{status_text}",
        metadata: {
          order_id: order.id,
          product_id: order.product_listing_id,
          product_name: order.product_listing&.name,
          old_status: old_status,
          new_status: order.status
        }
      )
    end

    # Thông báo tin nhắn mới
    def new_message(message)
      return unless message.is_a?(Message)

      conversation = message.conversation

      # Xác định người nhận là người còn lại trong cuộc trò chuyện
      recipient_id = if message.sender_id == conversation.sender_id
                       conversation.recipient_id
      else
                       conversation.sender_id
      end

      create_notification(
        recipient_id: recipient_id,
        sender_id: message.sender_id,
        notifiable: message,
        category: "marketplace",
        event_type: "new_message",
        title: "Tin nhắn mới",
        message: "Bạn có tin nhắn mới từ #{message.sender.name}",
        metadata: {
          message_id: message.id,
          conversation_id: conversation.id,
          message_content: message.content.truncate(50),
          sender_name: message.sender.name
        }
      )
    end
  end
end
