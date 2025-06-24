module Repositories
  module SupplyChain
    class SupplyOrderRepository
      include ::Interfaces::Repositories::SupplyChain::SupplyOrderRepositoryInterface

      def find(id)
        begin
          record = ::Models::SupplyChain::SupplyOrder
            .includes(:user, supply_listing: { user: {}, supply_images: { image_attachment: :blob } })
            .find(id)

          { success: true, order: map_to_entity(record, include_details: true) }
        rescue ActiveRecord::RecordNotFound
          { success: false, errors: [ "Không tìm thấy đơn hàng" ] }
        end
      end

      def find_by_user(user_id, filters = {})
        query = ::Models::SupplyChain::SupplyOrder
          .where(user_id: user_id)
          .includes(:user, supply_listing: { user: {}, supply_images: { image_attachment: :blob } })
          .order(created_at: :desc)

        query = query.where(status: filters[:status]) if filters[:status].present?

        orders = query.map { |record| map_to_entity(record) }
        { success: true, orders: orders }
      end

      def find_by_supplier(user_id, filters = {})
        query = ::Models::SupplyChain::SupplyOrder
          .joins(:supply_listing)
          .where(supply_listings: { user_id: user_id })
          .includes(:user, supply_listing: { user: {}, supply_images: { image_attachment: :blob } })
          .order(created_at: :desc)

        query = query.where(status: filters[:status]) if filters[:status].present?

        orders = query.map { |record| map_to_entity(record) }
        { success: true, orders: orders }
      end

      def create(entity, supply_listing)
        begin
          ActiveRecord::Base.transaction do
            # Kiểm tra số lượng tồn kho và số lượng đang tạm giữ
            available_quantity = supply_listing.quantity - supply_listing.pending_quantity

            if available_quantity < entity.quantity
              return {
                success: false,
                errors: [ "Số lượng vật tư không đủ. Hiện chỉ còn #{available_quantity} #{supply_listing.unit} có thể đặt." ]
              }
            end

            # Lấy giá từ frontend hoặc fallback sang giá từ database
            price_to_use = entity.price.presence || supply_listing.price

            # Kiểm tra giá hợp lệ
            if price_to_use.nil? || price_to_use <= 0
              return {
                success: false,
                errors: [ "Giá phải lớn hơn 0" ]
              }
            end

            # Tạo record đơn hàng
            record = ::Models::SupplyChain::SupplyOrder.new(
              user_id: entity.user_id,
              supply_listing_id: supply_listing.id,
              quantity: entity.quantity,
              price: price_to_use,  # Sử dụng giá đã xác định
              status: "pending",
              note: entity.note,
              delivery_province: entity.delivery_province,
              delivery_district: entity.delivery_district,
              delivery_ward: entity.delivery_ward,
              delivery_address: entity.delivery_address,
              contact_phone: entity.contact_phone,
              payment_method: entity.payment_method || "cod",
              is_paid: false,
              purchase_date: Time.current,
              supply_id: supply_listing.id
            )

            if record.save
              # Lấy ActiveRecord model object thay vì sử dụng entity
              listing_record = ::Models::SupplyChain::SupplyListing.find(supply_listing.id)
              
              # Sử dụng ActiveRecord object cho các phương thức update
              listing_record.increment!(:order_count) if listing_record.respond_to?(:order_count)
              listing_record.increment!(:pending_quantity, entity.quantity)

              { success: true, order: map_to_entity(record), message: "Đặt hàng thành công" }
            else
              return { success: false, errors: record.errors.full_messages }
            end
          end
        rescue => e
          { success: false, errors: [ "Lỗi khi tạo đơn hàng: #{e.message}" ] }
        end
      end

      def update(id, attributes)
        record = ::Models::SupplyChain::SupplyOrder.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy đơn hàng" ] } unless record

        if record.update(attributes)
          { success: true, order: map_to_entity(record), message: "Cập nhật đơn hàng thành công" }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update_status(id, status, rejection_reason = nil)
        record = ::Models::SupplyChain::SupplyOrder.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy đơn hàng" ] } unless record

        old_status = record.status

        begin
          ActiveRecord::Base.transaction do
            case status
            when "confirmed"
              result = confirm_order(record)
            when "shipped"
              result = update_order_status(record, status, "Đơn hàng đã được chuyển sang trạng thái đang giao")
            when "delivered"
              result = update_order_status(record, status, "Đơn hàng đã được chuyển sang trạng thái đã giao")
            when "rejected"
              result = reject_order(record, rejection_reason)
            when "cancelled"
              result = cancel_order(record)
            else
              return { success: false, errors: [ "Trạng thái không hợp lệ" ] }
            end

            if result[:success]
              log_order_status_change(record, old_status, record.status)
              { success: true, order: map_to_entity(record), message: result[:message] }
            else
              raise ActiveRecord::Rollback
              result
            end
          end
        rescue => e
          { success: false, errors: [ "Lỗi khi cập nhật đơn hàng: #{e.message}" ] }
        end
      end

      def cancel_order(id, user_id)
        record = ::Models::SupplyChain::SupplyOrder.where(id: id, user_id: user_id).first
        return { success: false, errors: [ "Không tìm thấy đơn hàng" ] } unless record

        # Chỉ có thể hủy đơn hàng ở trạng thái pending
        unless record.pending?
          return { success: false, errors: [ "Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận" ] }
        end

        begin
          ActiveRecord::Base.transaction do
            if record.update(status: :cancelled)
              # Giảm số lượng đang tạm giữ
              record.supply_listing.decrement!(:pending_quantity, record.quantity)

              log_order_status_change(record, "pending", "cancelled")

              { success: true, order: map_to_entity(record), message: "Hủy đơn hàng thành công" }
            else
              raise ActiveRecord::Rollback
              { success: false, errors: record.errors.full_messages }
            end
          end
        rescue => e
          { success: false, errors: [ "Lỗi khi hủy đơn hàng: #{e.message}" ] }
        end
      end

      def complete_order(id, user_id)
        record = ::Models::SupplyChain::SupplyOrder.where(id: id, user_id: user_id).first
        return { success: false, errors: [ "Không tìm thấy đơn hàng" ] } unless record

        # Chỉ có thể hoàn thành đơn hàng ở trạng thái đã giao
        unless record.delivered?
          return { success: false, errors: [ "Chỉ có thể xác nhận nhận hàng khi đơn hàng đã được giao" ] }
        end

        begin
          ActiveRecord::Base.transaction do
            if record.update(status: :completed)
              # Cập nhật số lượng đã bán thành công
              supply_listing = record.supply_listing
              supply_listing.increment!(:sold_quantity, record.quantity) if supply_listing.respond_to?(:sold_quantity)

              # Giảm số lượng đang tạm giữ nếu cần
              supply_listing.decrement!(:pending_quantity, record.quantity) if supply_listing.respond_to?(:pending_quantity) && supply_listing.pending_quantity > 0

              log_order_completion(record)

              {
                success: true,
                order: map_to_entity(record),
                message: "Xác nhận nhận hàng thành công",
                supply_listing: supply_listing
              }
            else
              raise ActiveRecord::Rollback
              { success: false, errors: record.errors.full_messages }
            end
          end
        rescue => e
          { success: false, errors: [ "Lỗi khi hoàn thành đơn hàng: #{e.message}" ] }
        end
      end

      def get_supplier_dashboard_stats(user_id)
        # Thống kê số lượng đơn hàng theo trạng thái
        order_stats = ::Models::SupplyChain::SupplyOrder.joins(:supply_listing)
                             .where(supply_listings: { user_id: user_id })
                             .group(:status)
                             .count

        # Thống kê doanh thu
        revenue = ::Models::SupplyChain::SupplyOrder.joins(:supply_listing)
                         .where(supply_listings: { user_id: user_id })
                         .where(status: [ :completed, :delivered ])
                         .sum("supply_orders.price * supply_orders.quantity")

        # Thống kê vật tư theo danh mục
        listing_stats = ::Models::SupplyChain::SupplyListing
                         .where(user_id: user_id)
                         .group(:category)
                         .count

        # Lấy đơn hàng đang chờ xử lý
        pending_orders_count = ::Models::SupplyChain::SupplyOrder.joins(:supply_listing)
                                .where(supply_listings: { user_id: user_id })
                                .where(status: :pending)
                                .count

        # Lấy đánh giá trung bình
        user = ::User.find_by(user_id: user_id)
        reviews_avg = user&.average_rating || 0

        # Lấy danh sách đơn hàng mới nhất
        recent_orders = ::Models::SupplyChain::SupplyOrder
                          .joins(:supply_listing)
                          .where(supply_listings: { user_id: user_id })
                          .includes(:user, supply_listing: { supply_images: { image_attachment: :blob } })
                          .order(created_at: :desc)
                          .limit(5)
                          .map { |record| map_to_entity(record) }

        {
          success: true,
          data: {
            order_stats: order_stats,
            revenue: revenue,
            listing_stats: listing_stats,
            pending_orders: pending_orders_count,
            reviews_avg: reviews_avg,
            recent_orders: recent_orders
          }
        }
      end

      private

      def map_to_entity(record, include_details = false)
        entity = Entities::SupplyChain::SupplyOrder.new(
          id: record.id,
          user_id: record.user_id,
          supply_listing_id: record.supply_listing_id,
          quantity: record.quantity,
          price: record.price,
          status: record.status,
          note: record.note,
          rejection_reason: record.rejection_reason,
          delivery_province: record.delivery_province,
          delivery_district: record.delivery_district,
          delivery_ward: record.delivery_ward,
          delivery_address: record.delivery_address,
          contact_phone: record.contact_phone,
          payment_method: record.payment_method,
          is_paid: record.is_paid,
          purchase_date: record.purchase_date,
          created_at: record.created_at,
          updated_at: record.updated_at,
          supply_id: record.supply_id,
          has_review: include_details ? has_review(record) : nil
        )

        # Add supply listing info
        if record.supply_listing
          entity.supply_listing = {
            id: record.supply_listing.id,
            name: record.supply_listing.name,
            category: record.supply_listing.category,
            unit: record.supply_listing.unit,
            brand: record.supply_listing.brand,
            manufacturer: record.supply_listing.manufacturer,
            images: record.supply_listing.supply_images.map { |img| { url: img.image_url, position: img.position } }
          }
        end

        # Add buyer info
        if record.user
          entity.buyer = {
            id: record.user.user_id,
            name: record.user.user_name,
            phone: record.user.phone
          }
        end

        # Add supplier info
        if record.supply_listing&.user
          entity.supplier = {
            id: record.supply_listing.user.user_id,
            name: record.supply_listing.user.user_name,
            phone: record.supply_listing.user.phone
          }
        end

        entity
      end

      def has_review(record)
        Models::SupplyChain::SupplierReview.exists?(supply_order_id: record.id)
      end

      def confirm_order(record)
        # Kiểm tra số lượng tồn kho thực tế
        listing = record.supply_listing

        if listing.quantity >= record.quantity
          record.status = :confirmed

          # Giảm số lượng tồn kho thực tế
          listing.decrement!(:quantity, record.quantity)

          # Giảm số lượng đang tạm giữ
          listing.decrement!(:pending_quantity, record.quantity)

          # Cập nhật trạng thái nếu hết hàng
          if listing.quantity <= 0
            listing.update(status: :sold_out)
          end

          if record.save
            { success: true, message: "Đơn hàng đã được xác nhận" }
          else
            { success: false, errors: record.errors.full_messages }
          end
        else
          # Không đủ hàng để xác nhận
          record.update(status: :rejected, rejection_reason: "Số lượng vật tư không đủ")
          { success: false, errors: [ "Số lượng vật tư không đủ để đáp ứng đơn hàng" ] }
        end
      end

      def update_order_status(record, status, message)
        record.status = status

        if record.save
          { success: true, message: message }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def reject_order(record, rejection_reason)
        old_status = record.status

        record.status = :rejected
        record.rejection_reason = rejection_reason

        # Nếu đơn đã được xác nhận, cần trả lại số lượng vật tư
        if old_status == "confirmed"
          record.supply_listing.increment!(:quantity, record.quantity)

          # Cập nhật lại trạng thái nếu trước đó là hết hàng
          if record.supply_listing.status == "sold_out" && record.supply_listing.quantity > 0
            record.supply_listing.update(status: :active)
          end
        elsif old_status == "pending"
          # Nếu từ chối đơn đang chờ, giảm số lượng đang tạm giữ
          record.supply_listing.decrement!(:pending_quantity, record.quantity)
        end

        if record.save
          { success: true, message: "Đơn hàng đã bị từ chối" }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def cancel_order(record)
        old_status = record.status

        record.status = :cancelled

        # Xử lý tồn kho dựa trên trạng thái cũ
        if old_status == "confirmed"
          # Trả lại số lượng
          record.supply_listing.increment!(:quantity, record.quantity)

          # Cập nhật lại trạng thái nếu trước đó là hết hàng
          if record.supply_listing.status == "sold_out" && record.supply_listing.quantity > 0
            record.supply_listing.update(status: :active)
          end
        elsif old_status == "pending"
          # Giảm số lượng đang tạm giữ
          record.supply_listing.decrement!(:pending_quantity, record.quantity)
        end

        if record.save
          { success: true, message: "Đơn hàng đã được hủy" }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def log_order_status_change(order, old_status, new_status)
        Models::ActivityLog.create(
          user_id: order.user_id,
          action_type: "order_status_change",
          target_type: "SupplyOrder",
          target_id: order.id,
          details: {
            old_status: old_status,
            new_status: new_status,
            order_quantity: order.quantity,
            product_name: order.supply_listing.name
          }
        )
      end

      def log_order_completion(order)
        Models::ActivityLog.create(
          user_id: order.user_id,
          action_type: "complete_order",
          target_type: "SupplyOrder",
          target_id: order.id,
          details: {
            quantity: order.quantity,
            product_name: order.supply_listing.name
          }
        )
      end
    end
  end
end
