module UseCases::Marketplace
  module ProductOrders
    class CreateOrder
      def initialize(repository, product_repository, notification_service = nil, conversation_service = nil)
        @repository = repository
        @product_repository = product_repository
        @notification_service = notification_service || Services::CleanArch.notification_service
        @conversation_service = conversation_service || Services::Marketplace::ConversationService.new
      end

      def execute(attributes, user_id)
        # Kiểm tra role
        user = Models::User.find_by(user_id: user_id)
        unless user&.user_type == 'trader'
          return { success: false, error: "Chỉ thương lái mới có thể đặt mua sản phẩm" }
        end

        # Tìm sản phẩm
        product = @product_repository.find(attributes[:product_listing_id])
        unless product
          return { success: false, error: "Không tìm thấy sản phẩm", status: :not_found }
        end

        # Cho phép thương lái tạo nhiều đơn hàng trên 1 sản phẩm
        # Không kiểm tra đơn hàng đã tồn tại nữa

        # Debug logging
        Rails.logger.info "=== CREATE ORDER DEBUG ==="
        Rails.logger.info "Attributes received: #{attributes.inspect}"
        Rails.logger.info "total_weight in attributes: #{attributes[:total_weight]}"
        Rails.logger.info "total_weight class: #{attributes[:total_weight].class}"

        # Tạo đơn hàng entity
        order_entity = Entities::Marketplace::ProductOrder.new(
          buyer_id: user_id,
          product_listing_id: attributes[:product_listing_id],
          quantity: attributes[:quantity],
          price: attributes[:price],
          note: attributes[:note],
          status: :pending,
          total_weight: attributes[:total_weight]
        )

        Rails.logger.info "Entity created:"
        Rails.logger.info "  total_weight: #{order_entity.total_weight}"
        Rails.logger.info "  total_weight class: #{order_entity.total_weight.class}"

        # Lưu order
        order = @repository.create(order_entity)

        unless order
          return { success: false, errors: [ "Không thể tạo đơn hàng" ] }
        end

        # Tạo hoặc tìm conversation
        conversation = create_or_find_conversation(product, user_id)

        # Thêm tin nhắn thông báo
        if conversation
          send_order_message(conversation, order, user)
        end

        # Thêm thông báo về đơn hàng mới
        @notification_service.new_order(order)

        {
          success: true,
          message: "Đã gửi yêu cầu đặt mua thành công",
          order: order,
          conversation_id: conversation&.id
        }
      end

      private

      def create_or_find_conversation(product, user_id)
        Models::Conversation.find_or_create_by(
          product_listing_id: product.id,
          sender_id: user_id,
          receiver_id: product.user_id
        )
      end

      def send_order_message(conversation, order, user)
        message_content = "Tôi đã đặt mua #{order.quantity} #{order.product_listing.product_type}."
        message_content += " Giá đề xuất: #{order.price}/kg" if order.price.present?
        message_content += " Ghi chú: #{order.note}" if order.note.present?

        # Thêm link đến đơn hàng (sử dụng route marketplace orders)
        message_content += "\\n\\n📋 Xem chi tiết đơn hàng: /orders/#{order.id}"

        # Sử dụng Firebase message service thay vì ActiveRecord
        @conversation_service.send_message(
          conversation.id,
          user.user_id,
          message_content,
          "order",
          {
            order_info: {
              order_id: order.id,
              quantity: order.quantity,
              price: order.price,
              status: order.status,
              product_title: order.product_listing.title
            }
          }
        )
      end
    end
  end
end
