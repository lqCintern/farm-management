# app/services/notification/supply_notification_service.rb
module NotificationServices
  class SupplyNotificationService < BaseService
    # Thông báo đơn đặt hàng vật tư mới
    def new_supply_order(order)
      return unless order.is_a?(SupplyOrder)

      # Thông báo cho nhà cung cấp
      supplier = order.supply_listing&.user
      return unless supplier

      create_notification(
        recipient_id: supplier.id,
        sender_id: order.user_id,
        notifiable: order,
        category: "supply",
        event_type: "new_supply_order",
        title: "Đơn hàng vật tư mới",
        message: "Bạn có đơn hàng vật tư mới: #{order.supply_listing&.name}",
        metadata: {
          order_id: order.id,
          supply_id: order.supply_id,
          supply_name: order.supply_listing&.name,
          quantity: order.quantity,
          total_price: order.price * order.quantity,
          buyer_name: order.user&.name
        }
      )
    end

    # Thông báo cập nhật đơn vật tư
    def supply_order_updated(order, old_status)
      return unless order.is_a?(SupplyOrder)

      # Thông báo cho người mua
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
        sender_id: order.supply_listing&.user_id,
        notifiable: order,
        category: "supply",
        event_type: "supply_order_updated",
        title: "Cập nhật đơn hàng vật tư",
        message: "Đơn hàng vật tư #{order.id} #{status_text}",
        metadata: {
          order_id: order.id,
          supply_id: order.supply_id,
          supply_name: order.supply_listing&.name,
          old_status: old_status,
          new_status: order.status
        }
      )
    end

    # Nhắc nhở đánh giá nhà cung cấp
    def review_reminder(order)
      return unless order.is_a?(SupplyOrder) && order.status == "completed"

      # Chỉ gửi nếu chưa có đánh giá
      has_review = order.supplier_reviews.exists?
      return if has_review

      create_notification(
        recipient_id: order.user_id,
        sender_id: nil,
        notifiable: order,
        category: "supply",
        event_type: "review_reminder",
        title: "Đánh giá nhà cung cấp",
        message: "Bạn đã nhận được hàng. Hãy đánh giá nhà cung cấp cho đơn hàng #{order.supply_listing&.name}",
        metadata: {
          order_id: order.id,
          supply_id: order.supply_id,
          supply_name: order.supply_listing&.name,
          supplier_id: order.supply_listing&.user_id,
          supplier_name: order.supply_listing&.user&.name
        }
      )
    end
  end
end
