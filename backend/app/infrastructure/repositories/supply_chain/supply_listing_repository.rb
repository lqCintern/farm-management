module Repositories
  module SupplyChain
    class SupplyListingRepository
      include ::Interfaces::Repositories::SupplyChain::SupplyListingRepositoryInterface

      def find(id)
        begin
          record = ::Models::SupplyChain::SupplyListing.includes(:user, supply_images: { image_attachment: :blob }).find(id)
          { success: true, listing: map_to_entity(record, include_details: true) }
        rescue ActiveRecord::RecordNotFound
          { success: false, errors: [ "Không tìm thấy vật tư" ] }
        end
      end

      def find_all(filters = {}, page = 1, per_page = 15)
        query = ::Models::SupplyChain::SupplyListing.where(status: :active)
                                          .includes(:user, supply_images: { image_attachment: :blob })
                                          .order(created_at: :desc)

        # Apply filters
        query = apply_filters(query, filters)

        # Pagination - FIX HERE
        total_count = query.count
        pagy = Pagy.new(count: total_count, page: page, items: per_page)
        # Sử dụng per_page thay vì pagy.items
        records = query.offset(pagy.offset).limit(per_page)

        listings = records.map { |record| map_to_entity(record) }

        {
          success: true,
          listings: listings,
          pagination: {
            total_pages: pagy.pages,
            current_page: pagy.page,
            total_count: total_count,
            per_page: per_page
          }
        }
      end

      def create(entity)
        record = ::Models::SupplyChain::SupplyListing.new(
          name: entity.name,
          description: entity.description,
          category: entity.category,
          price: entity.price,
          unit: entity.unit,
          quantity: entity.quantity,
          brand: entity.brand,
          manufacturer: entity.manufacturer,
          manufacturing_date: entity.manufacturing_date,
          expiry_date: entity.expiry_date,
          province: entity.province,
          district: entity.district,
          ward: entity.ward,
          address: entity.address,
          status: entity.status || "draft",
          user_id: entity.user_id,
          pending_quantity: entity.pending_quantity || 0,
          sold_quantity: entity.sold_quantity || 0,
          last_updated: entity.last_updated || Time.current
        )

        if record.save
          { success: true, listing: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update(id, attributes)
        record = ::Models::SupplyChain::SupplyListing.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless record

        if record.update(attributes)
          { success: true, listing: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id)
        record = ::Models::SupplyChain::SupplyListing.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless record

        if record.destroy
          { success: true }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def increment_view_count(id)
        record = ::Models::SupplyChain::SupplyListing.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless record

        record.increment!(:view_count)
        { success: true, view_count: record.view_count }
      end

      def update_stock_after_order(id, ordered_quantity)
        record = ::Models::SupplyChain::SupplyListing.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless record

        new_quantity = record.quantity - ordered_quantity
        status = new_quantity <= 0 ? :sold_out : :active

        if record.update(quantity: new_quantity, status: status)
          { success: true, listing: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def find_similar(id, limit = 6)
        record = ::Models::SupplyChain::SupplyListing.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless record

        similar_records = ::Models::SupplyChain::SupplyListing.where(category: record.category)
                                                   .where.not(id: record.id)
                                                   .where(status: :active)
                                                   .limit(limit)

        similar_listings = similar_records.map { |similar| map_to_entity(similar) }

        { success: true, listings: similar_listings }
      end

      def get_categories
        categories = ::Models::SupplyChain::SupplyListing.categories.keys.map do |category|
          {
            value: category,
            label: I18n.t("supply_listing.categories.#{category}", default: category.to_s.humanize)
          }
        end

        { success: true, categories: categories }
      end

      def find_by_user_id(user_id)
        records = ::Models::SupplyChain::SupplyListing.where(user_id: user_id)
                                            .includes(supply_images: { image_attachment: :blob })
                                            .order(created_at: :desc)

        listings = records.map { |record| map_to_entity(record) }

        { success: true, listings: listings }
      end

      def find_by_id_and_user(id, user_id)
        record = ::Models::SupplyChain::SupplyListing.includes(supply_images: { image_attachment: :blob })
                                           .where(id: id, user_id: user_id).first

        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless record

        { success: true, listing: map_to_entity(record, include_details: true) }
      end

      private

      def apply_filters(query, filters)
        query = query.where(category: filters[:category]) if filters[:category].present?
        query = query.where(province: filters[:province]) if filters[:province].present?
        query = query.where(district: filters[:district]) if filters[:district].present?

        if filters[:min_price].present? && filters[:max_price].present?
          query = query.where(price: filters[:min_price]..filters[:max_price])
        elsif filters[:min_price].present?
          query = query.where("price >= ?", filters[:min_price])
        elsif filters[:max_price].present?
          query = query.where("price <= ?", filters[:max_price])
        end

        query = query.where("name LIKE ?", "%#{filters[:name]}%") if filters[:name].present?
        query
      end

      def map_to_entity(record, include_details: false)
        # Basic entity data
        entity = Entities::SupplyChain::SupplyListing.new(
          id: record.id,
          name: record.name,
          description: record.description,
          category: record.category,
          price: record.price,
          unit: record.unit,
          quantity: record.quantity,
          brand: record.brand,
          manufacturer: record.manufacturer,
          manufacturing_date: record.manufacturing_date,
          expiry_date: record.expiry_date,
          province: record.province,
          district: record.district,
          ward: record.ward,
          address: record.address,
          status: record.status,
          view_count: record.view_count,
          created_at: record.created_at,
          updated_at: record.updated_at,
          last_updated: record.last_updated,
          user_id: record.user.user_id,
          pending_quantity: record.pending_quantity || 0,
          sold_quantity: record.sold_quantity || 0,
          # Thêm số lượng đơn hàng
          order_count: calculate_order_count(record.id)
        )

        # Add supplier information
        entity.supplier = {
          id: record.user.user_id,
          name: record.user.user_name,
          phone: include_details ? record.user.phone : nil,
          address: include_details ? record.user.address : nil,
          average_rating: include_details ? calculate_average_rating(record.user) : nil
        }

        # Add images
        entity.images = map_images(record.supply_images, include_details)

        # Add similar listings if needed
        if include_details
          similar_result = find_similar(record.id)
          entity.similar_listings = similar_result[:success] ? similar_result[:listings] : []
        end

        entity
      end

      def calculate_average_rating(user)
        user.respond_to?(:average_rating) ? user.average_rating : nil
      end

      def map_images(images, include_all = false)
        return [] if images.empty?

        if include_all
          images.sorted.map do |img|
            {
              id: img.id,
              url: img.image_url,
              position: img.position
            }
          end
        else
          main_image = images.sorted.first
          return [] unless main_image

          [ {
            id: main_image.id,
            url: main_image.image_url,
            position: main_image.position
          } ]
        end
      end

      # Thêm phương thức tính số lượng đơn hàng thực tế
      def calculate_order_count(listing_id)
        Models::SupplyChain::SupplyOrder
          .where(supply_listing_id: listing_id)
          .where.not(status: [ :cancelled, :rejected ]) # Không tính các đơn bị hủy hoặc từ chối
          .count
      end
    end
  end
end
