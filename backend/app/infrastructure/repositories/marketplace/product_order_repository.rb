module Repositories
  module Marketplace
    class ProductOrderRepository
      def find(id)
        record = ::Models::Marketplace::ProductOrder.find_by(id: id)
        map_to_entity(record) if record
      end

      def find_with_associations(id)
        record = ::Models::Marketplace::ProductOrder.includes(:product_listing, :buyer)
                                          .find_by(id: id)
        map_to_entity(record) if record
      end

      def list_for_buyer(buyer_id, status = nil, page = 1, per_page = 10)
        query = ::Models::Marketplace::ProductOrder.where(buyer_id: buyer_id)
        query = apply_status_filter(query, status)

        pagy = Pagy.new(count: query.count, page: page, items: per_page)
        records = query.includes(:product_listing)
                     .order(created_at: :desc)
                     .offset(pagy.offset)
                     .limit(pagy.items)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def list_for_seller(seller_id, status = nil, page = 1, per_page = 10)
        query = ::Models::Marketplace::ProductOrder.joins(:product_listing)
                                          .where(product_listings: { user_id: seller_id })
        query = apply_status_filter(query, status)

        pagy = Pagy.new(count: query.count, page: page, items: per_page)
        records = query.includes(:product_listing, :buyer)
                     .order(created_at: :desc)
                     .offset(pagy.offset)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def create(entity)
        record = ::Models::Marketplace::ProductOrder.new(
          product_listing_id: entity.product_listing_id,
          buyer_id: entity.buyer_id,
          quantity: entity.quantity,
          price: entity.price,
          note: entity.note,
          status: entity.status || "pending"
        )

        if record.save
          map_to_entity(record)
        else
          nil
        end
      end

      def update(entity)
        record = ::Models::Marketplace::ProductOrder.find_by(id: entity.id)
        return nil unless record

        attributes = {
          quantity: entity.quantity,
          price: entity.price,
          note: entity.note
        }

        if record.update(attributes)
          map_to_entity(record)
        else
          nil
        end
      end

      def change_status(id, new_status, rejection_reason = nil)
        record = ::Models::Marketplace::ProductOrder.find_by(id: id)
        return nil unless record

        # Prepare update attributes
        attributes = { status: new_status }
        attributes[:rejection_reason] = rejection_reason if new_status == "rejected"

        if record.update(attributes)
          map_to_entity(record)
        else
          nil
        end
      end

      def get_stats(user_id, is_seller = false)
        if is_seller
          base_query = ::Models::Marketplace::ProductOrder.joins(:product_listing)
                                                .where(product_listings: { user_id: user_id })
        else
          base_query = ::Models::Marketplace::ProductOrder.where(buyer_id: user_id)
        end

        {
          pending: base_query.where(status: :pending).count,
          accepted: base_query.where(status: :accepted).count,
          completed: base_query.where(status: :completed).count,
          rejected: base_query.where(status: :rejected).count,
          total: base_query.count
        }
      end

      def order_exists?(product_listing_id, buyer_id)
        # Cho phép thương lái tạo nhiều đơn hàng trên 1 sản phẩm
        # Luôn trả về false để không block việc tạo đơn hàng mới
        false
      end

      def reject_other_orders(accepted_order_id, product_listing_id, reason = "Đơn hàng đã được bán cho người khác")
        orders = ::Models::Marketplace::ProductOrder
          .where(product_listing_id: product_listing_id)
          .where.not(id: accepted_order_id)
          .where(status: :pending)

        orders.each do |order|
          order.update(
            status: :rejected,
            rejection_reason: reason
          )
        end
      end

      private

      def apply_status_filter(query, status)
        return query unless status.present?
        query.where(status: status)
      end

      def map_to_entity(record)
        return nil unless record

        Entities::Marketplace::ProductOrder.new(
          id: record.id,
          product_listing_id: record.product_listing_id,
          buyer_id: record.buyer_id,
          quantity: record.quantity,
          price: record.price,
          note: record.note,
          status: record.status,
          rejection_reason: record.rejection_reason,
          created_at: record.created_at,
          updated_at: record.updated_at,
          product_listing: map_product_listing(record.product_listing),
          buyer: map_user(record.buyer)
        )
      end

      def map_product_listing(record)
        return nil unless record

        product_images = record.product_images.map do |image|
          Entities::Marketplace::ProductImage.new(
            id: image.id,
            image_url: image.image_url,
            position: image.position
          )
        end

        Entities::Marketplace::ProductListing.new(
          id: record.id,
          title: record.title,
          product_type: record.product_type,
          quantity: record.quantity,
          price_expectation: record.price_expectation,
          status: record.status,
          product_images: product_images,
          user_id: record.user_id
        )
      end

      def map_user(user)
        return nil unless user

        {
          user_id: user.user_id,
          user_name: user.user_name,
          fullname: user.fullname,
          phone: user.phone
        }
      end
    end
  end
end
