module Services::Marketplace
  class HarvestService
    def initialize(harvest, user)
      @harvest = harvest
      @user = user
      @conversation_service = ConversationService.new
      @transaction_service = TransactionService.new
    end

    def create(params, product_listing)
      # Xác định farmer_id từ product_listing
      farmer_id = product_listing.user_id

      # Kiểm tra quyền truy cập dựa trên user_id (không phải id)
      unless farmer_id == @user.user_id
        return { success: false, error: "Chỉ hộ sản xuất mới có thể lên lịch thu hoạch cho sản phẩm của mình" }
      end

      @harvest.product_listing = product_listing
      @harvest.trader_id = params[:trader_id]

      # Nếu có product_order_id, liên kết với đơn hàng
      if params[:product_order_id].present?
        order = ::Models::Marketplace::ProductOrder.find_by(id: params[:product_order_id])
        if order && (order.product_listing_id == product_listing.id)
          @harvest.product_order = order
        end
      end

      if @harvest.save
        # Cập nhật trạng thái sản phẩm
        product_listing.update(status: ::Marketplace::ProductListing::STATUS_RESERVED)

        # Gửi tin nhắn thông báo
        message_content = "Đã lên lịch thu hoạch cho sản phẩm #{product_listing.title} vào #{@harvest.scheduled_date.strftime('%d/%m/%Y %H:%M')}. Địa điểm: #{@harvest.location}"
        @conversation_service.send_schedule_notification(@harvest, @user, message_content)

        { success: true, harvest: @harvest }
      else
        { success: false, errors: @harvest.errors.full_messages }
      end
    end

    def update(params)
      unless @harvest.can_be_managed_by?(@user)
        return { success: false, error: "Không có quyền cập nhật lịch thu hoạch này" }
      end

      # Kiểm tra xem có cập nhật trạng thái không
      status_changed = params[:status] &&
                      params[:status].to_i != @harvest.status_before_type_cast

      if @harvest.update(params)
        # Cập nhật trạng thái sản phẩm nếu trạng thái thu hoạch thay đổi
        if status_changed
          case @harvest.status
          when "completed"
            @harvest.product_listing.update(status: ::Marketplace::ProductListing::STATUS_SOLD)
            # Cập nhật đơn hàng nếu có
            if @harvest.product_order
              @harvest.product_order.update(status: :completed)
            end
          when "cancelled"
            @harvest.product_listing.update(status: ::Marketplace::ProductListing::STATUS_ACTIVE)
          end
        end

        # Tạo nội dung thông báo
        content = if status_changed
          "Cập nhật trạng thái thu hoạch: #{@harvest.status}"
        else
          "Cập nhật lịch thu hoạch sang ngày #{@harvest.scheduled_date.strftime('%d/%m/%Y %H:%M')}. Địa điểm: #{@harvest.location}"
        end

        # Gửi tin nhắn thông báo
        @conversation_service.send_schedule_notification(@harvest, @user, content, "schedule_update")

        { success: true, harvest: @harvest }
      else
        { success: false, errors: @harvest.errors.full_messages }
      end
    end

    def process_payment(params)
      # Chỉ thương lái mới được cập nhật bằng chứng thanh toán
      unless @harvest.trader_id == @user.user_id
        return { success: false, error: "Chỉ thương lái mới có thể cập nhật bằng chứng thanh toán" }
      end

      unless params[:image].present?
        return { success: false, error: "Hình ảnh không được để trống" }
      end

      # Đính kèm hình ảnh
      @harvest.payment_proof_image.attach(params[:image])

      # Cập nhật thông tin thanh toán
      @harvest.update(
        final_price: params[:final_price],
        payment_date: params[:payment_date] || Time.current,
        status: :completed
      )

      # Cập nhật trạng thái sản phẩm
      @harvest.product_listing.update(status: ::Marketplace::ProductListing::STATUS_SOLD)

      # Cập nhật đơn hàng nếu có
      if @harvest.product_order
        @harvest.product_order.update(
          status: :completed,
          final_price: params[:final_price]
        )
      end

      # Ghi nhận giao dịch
      @transaction_service.create_sale_transaction(@harvest)

      # Tìm conversation và gửi tin nhắn
      message_content = "Đã hoàn thành thanh toán #{params[:final_price]} đồng cho sản phẩm #{@harvest.product_listing.title}"

      # Gửi tin nhắn với hình ảnh đính kèm
      @conversation_service.send_message(
        @conversation_service.find_conversation(@harvest.product_listing_id, @harvest.trader_id)&.id,
        @user.user_id,
        message_content,
        "payment",
        {
          image_url: @harvest.payment_proof_url,
          payment_info: {
            amount: params[:final_price],
            date: @harvest.payment_date
          }
        }
      )

      { success: true, harvest: @harvest }
    end

    def destroy
      # Kiểm tra quyền xóa (chỉ farmer hoặc trader liên quan mới có quyền xóa)
      unless @harvest.can_be_managed_by?(@user)
        return { success: false, error: "Không có quyền xóa lịch thu hoạch này" }
      end

      # Lưu thông tin trước khi xóa để sử dụng trong tin nhắn
      product_title = @harvest.product_listing.title
      scheduled_date = @harvest.scheduled_date.strftime("%d/%m/%Y %H:%M")
      product_listing_id = @harvest.product_listing_id
      trader_id = @harvest.trader_id

      # Cập nhật trạng thái sản phẩm nếu đang reserved và chưa hoàn thành
      if @harvest.product_listing.status == ::Models::Marketplace::ProductListing::STATUS_SOLD &&
        @harvest.status != "completed"
        @harvest.product_listing.update(status: ::Marketplace::ProductListing::STATUS_ACTIVE)
      end

      # Xóa marketplace_harvest
      if @harvest.destroy
        # Gửi tin nhắn thông báo
        message_content = "Đã hủy lịch thu hoạch cho sản phẩm #{product_title} vào ngày #{scheduled_date}"

        conversation = @conversation_service.find_conversation(product_listing_id, trader_id)
        if conversation
          @conversation_service.send_message(conversation.id, @user.user_id, message_content, "schedule_cancel")
        end

        { success: true, message: "Đã xóa lịch thu hoạch thành công" }
      else
        { success: false, error: "Không thể xóa lịch thu hoạch" }
      end
    end
  end
end
