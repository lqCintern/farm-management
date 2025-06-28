module UseCases::Marketplace
  module ProductOrders
    class UpdateOrderStatus
      def initialize(repository, product_repository, transaction_service = nil, notification_service = nil, conversation_service = nil, marketplace_harvest_service = nil)
        @repository = repository
        @product_repository = product_repository
        @transaction_service = transaction_service || Services::Marketplace::TransactionService.new
        @notification_service = notification_service || Services::CleanArch.notification_service
        @conversation_service = conversation_service || Services::Marketplace::ConversationService.new
        @marketplace_harvest_service = marketplace_harvest_service || Services::CleanArch.marketplace_create_harvest
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
          # Lấy order đã cập nhật từ kết quả
          updated_order = result[:order]

          # Truyền object order thay vì order_id
          @notification_service.order_status_updated(updated_order, old_status)
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

        # Kiểm tra số lượng sản phẩm có đủ không
        product_listing = @product_repository.find(order.product_listing_id)
        if product_listing.quantity < order.quantity
          return { success: false, error: "Số lượng sản phẩm không đủ để hoàn thành đơn hàng" }
        end

        # Giảm số lượng sản phẩm
        new_quantity = product_listing.quantity - order.quantity
        
        # Tạo entity mới với số lượng đã cập nhật
        updated_product_entity = Entities::Marketplace::ProductListing.new(
          id: product_listing.id,
          title: product_listing.title,
          description: product_listing.description,
          product_type: product_listing.product_type,
          quantity: new_quantity,
          average_size: product_listing.average_size,
          price_expectation: product_listing.price_expectation,
          status: product_listing.status,
          province: product_listing.province,
          district: product_listing.district,
          ward: product_listing.ward,
          address: product_listing.address,
          latitude: product_listing.latitude,
          longitude: product_listing.longitude,
          user_id: product_listing.user_id,
          crop_animal_id: product_listing.crop_animal_id,
          harvest_start_date: product_listing.harvest_start_date,
          harvest_end_date: product_listing.harvest_end_date,
          location_note: product_listing.location_note,
          total_weight: product_listing.total_weight
        )
        
        @product_repository.update(updated_product_entity)

        updated_order = @repository.change_status(order.id, "completed")

        if updated_order
          # Thông báo qua tin nhắn
          notification = user_id == order.buyer_id ?
            "Tôi đã nhận được sản phẩm, cảm ơn bạn!" :
            "Giao dịch đã hoàn tất, cảm ơn bạn!"

          send_notification_message(order, user_id, notification)

          # Ghi nhận doanh thu
          @transaction_service.create_sale_transaction(updated_order)

          # Tự động tạo MarketplaceHarvest để đồng bộ với FarmActivity
          create_marketplace_harvest_from_order(updated_order)

          { success: true, message: "Đã hoàn thành đơn hàng", status: "completed", order: updated_order }
        else
          { success: false, error: "Không thể cập nhật trạng thái" }
        end
      end

      def send_notification_message(order, user_id, message)
        @conversation_service.send_order_notification(order, Models::User.find_by(user_id: user_id), message)
      end

      def create_marketplace_harvest_from_order(order)
        @marketplace_harvest_service.create_from_order(order)
      end
    end
  end
end
