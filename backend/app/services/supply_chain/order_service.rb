module SupplyChain
  class OrderService
    def initialize(order, user)
      @order = order
      @user = user
    end

    # Cập nhật trạng thái đơn hàng
    def update_status(status, rejection_reason = nil)
      # Lưu trạng thái cũ để xử lý logic
      old_status = @order.status

      ActiveRecord::Base.transaction do
        case status
        when "confirmed"
          return confirm_order
        when "shipped"
          return ship_order
        when "delivered"
          return deliver_order
        when "rejected"
          return reject_order(rejection_reason)
        else
          return { success: false, error: "Trạng thái không hợp lệ", status: :unprocessable_entity }
        end
      end
    rescue => e
      return { success: false, error: "Lỗi xử lý: #{e.message}", status: :internal_server_error }
    end

    private

    def confirm_order
      # Xác nhận đơn hàng
      @order.status = :confirmed
      
      # Kiểm tra số lượng tồn kho thực tế
      listing = @order.supply_listing
      if listing.quantity >= @order.quantity
        # Giảm số lượng tồn kho thực tế
        listing.decrement!(:quantity, @order.quantity)
        
        # Giảm số lượng đang tạm giữ
        listing.decrement!(:pending_quantity, @order.quantity)
        
        # Cập nhật trạng thái nếu hết hàng
        if listing.quantity <= 0
          listing.update(status: :sold_out)
        end

        if @order.save
          { success: true, message: "Đơn hàng đã được xác nhận" }
        else
          raise ActiveRecord::Rollback
          { success: false, error: "Không thể cập nhật đơn hàng", errors: @order.errors }
        end
      else
        # Không đủ hàng để xác nhận
        @order.update(status: :rejected, rejection_reason: "Số lượng vật tư không đủ")
        raise ActiveRecord::Rollback
        { success: false, error: "Số lượng vật tư không đủ để đáp ứng đơn hàng", status: :unprocessable_entity }
      end
    end

    def ship_order
      # Chuyển sang trạng thái đang giao hàng
      @order.status = :shipped
      
      if @order.save
        { success: true, message: "Đơn hàng đã được chuyển sang trạng thái đang giao" }
      else
        raise ActiveRecord::Rollback
        { success: false, error: "Không thể cập nhật đơn hàng", errors: @order.errors }
      end
    end

    def deliver_order
      # Chuyển sang trạng thái đã giao hàng
      @order.status = :delivered
      
      if @order.save
        { success: true, message: "Đơn hàng đã được chuyển sang trạng thái đã giao" }
      else
        raise ActiveRecord::Rollback
        { success: false, error: "Không thể cập nhật đơn hàng", errors: @order.errors }
      end
    end

    def reject_order(rejection_reason)
      old_status = @order.status
      
      # Từ chối đơn hàng
      @order.status = :rejected
      @order.rejection_reason = rejection_reason
      
      # Nếu đơn đã được xác nhận, cần trả lại số lượng vật tư
      if old_status == "confirmed"
        @order.supply_listing.increment!(:quantity, @order.quantity)
        
        # Cập nhật lại trạng thái nếu trước đó là hết hàng
        if @order.supply_listing.status == "sold_out" && @order.supply_listing.quantity > 0
          @order.supply_listing.update(status: :active)
        end
      elsif old_status == "pending"
        # Nếu từ chối đơn đang chờ, giảm số lượng đang tạm giữ
        @order.supply_listing.decrement!(:pending_quantity, @order.quantity)
      end
      
      if @order.save
        { success: true, message: "Đơn hàng đã bị từ chối" }
      else
        raise ActiveRecord::Rollback
        { success: false, error: "Không thể cập nhật đơn hàng", errors: @order.errors }
      end
    end
  end
end
