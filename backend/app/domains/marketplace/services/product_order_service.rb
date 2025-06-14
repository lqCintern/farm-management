module Marketplace
  class ProductOrderService
    def initialize(order, user)
      @order = order
      @user = user
      @conversation_service = ConversationService.new
      @transaction_service = TransactionService.new
    end

    def create(params)
      unless @user.trader?
        return { success: false, error: "Chỉ thương lái mới có thể đặt mua sản phẩm" }
      end

      # Tìm sản phẩm
      product_listing = ::Marketplace::ProductListing.find_by(id: params[:product_listing_id])

      if product_listing.nil?
        return { success: false, error: "Không tìm thấy sản phẩm", status: :not_found }
      end

      # Kiểm tra đã đặt hàng chưa
      if ::Marketplace::ProductOrder.exists?(product_listing: product_listing, buyer: @user)
        return { success: false, error: "Bạn đã đặt mua sản phẩm này rồi", status: :unprocessable_entity }
      end

      # Tạo đơn hàng
      @order.buyer = @user
      @order.product_listing = product_listing

      if @order.save
        conversation = ::Conversation.find_or_create_by(
          product_listing: product_listing,
          sender: @user,
          receiver: product_listing.user
        )

        # Thêm tin nhắn thông báo
        message_content = "Tôi đã đặt mua #{@order.quantity} #{product_listing.product_type}."
        message_content += " Giá đề xuất: #{@order.price}/kg" if @order.price.present?
        message_content += " Ghi chú: #{@order.note}" if @order.note.present?

        conversation.messages.create(
          user: @user,
          content: message_content
        )

        # Thêm thông báo về đơn hàng mới
        ::NotificationServices::MarketplaceNotificationService.new.new_order(@order)

        { success: true, message: "Đã gửi yêu cầu đặt mua thành công", order: @order, conversation_id: conversation.id }
      else
        { success: false, errors: @order.errors.full_messages }
      end
    end

    def update_status(status, reason = nil)
      old_status = @order.status # Lưu trạng thái cũ để thông báo

      case status
      when "accept"
        # Chỉ người bán mới được accept
        unless @order.product_listing.user_id == @user.user_id
          return { success: false, error: "Chỉ người bán mới được chấp nhận đơn hàng" }
        end

        @order.update(status: :accepted)

        # Thêm thông báo cho người mua
        ::NotificationServices::MarketplaceNotificationService.new.order_status_updated(@order, old_status)

        # Tìm và thông báo qua tin nhắn
        @conversation_service.send_order_notification(@order, @user, "Tôi đã chấp nhận đơn đặt hàng của bạn!")

        { success: true, message: "Đã chấp nhận đơn hàng", status: @order.status }

      when "reject"
        # Chỉ người bán mới được reject
        unless @order.product_listing.user_id == @user.user_id
          return { success: false, error: "Chỉ người bán mới được từ chối đơn hàng" }
        end

        @order.update(
          status: :rejected,
          rejection_reason: reason
        )

        # Thêm thông báo cho người mua
        ::NotificationServices::MarketplaceNotificationService.new.order_status_updated(@order, old_status)

        # Tìm và thông báo qua tin nhắn
        reason_text = reason.present? ? "vì: #{reason}" : "vì không đáp ứng được yêu cầu"
        @conversation_service.send_order_notification(@order, @user, "Tôi không thể chấp nhận đơn hàng này #{reason_text}")

        { success: true, message: "Đã từ chối đơn hàng", status: @order.status }

      when "complete"
        # Cả người mua và người bán đều có thể đánh dấu hoàn thành
        if @order.product_listing.user_id != @user.user_id && @order.buyer_id != @user.user_id
          return { success: false, error: "Bạn không có quyền với đơn hàng này" }
        end

        # Chỉ khi đã accepted thì mới được complete
        unless @order.status == "accepted"
          return { success: false, error: "Đơn hàng cần được chấp nhận trước khi hoàn thành" }
        end

        @order.update(status: :completed)

        # Thêm thông báo hoàn thành cho các bên
        ::NotificationServices::MarketplaceNotificationService.new.order_status_updated(@order, old_status)

        # Thông báo qua tin nhắn
        notification = @user.user_id == @order.buyer_id ?
          "Tôi đã nhận được sản phẩm, cảm ơn bạn!" :
          "Giao dịch đã hoàn tất, cảm ơn bạn!"

        @conversation_service.send_order_notification(@order, @user, notification)

        # Ghi nhận doanh thu
        @transaction_service.create_sale_transaction(@order)

        # Cập nhật trạng thái sản phẩm
        @order.product_listing.update(status: ::Marketplace::ProductListing::STATUS_SOLD)

        { success: true, message: "Đã hoàn thành đơn hàng", status: @order.status }
      else
        { success: false, error: "Trạng thái không hợp lệ" }
      end
    end

    def get_order_statistics(user)
      if user.farmer?
        base_orders = ::Marketplace::ProductOrder.for_seller(user.user_id)
      else
        base_orders = user.product_orders
      end

      {
        pending: base_orders.where(status: :pending).count,
        accepted: base_orders.where(status: :accepted).count,
        completed: base_orders.where(status: :completed).count,
        rejected: base_orders.where(status: :rejected).count,
        total: base_orders.count
      }
    end
  end
end
