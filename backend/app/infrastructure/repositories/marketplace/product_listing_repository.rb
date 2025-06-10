module Repositories
  module Marketplace
    class ProductListingRepository
      def find(id)
        record = ::Marketplace::ProductListing.find_by(id: id)
        map_to_entity(record) if record
      end

      def find_with_associations(id)
        record = ::Marketplace::ProductListing.includes(:product_images, :user)
                                             .find_by(id: id)
        return nil unless record

        # Tăng view_count
        record.increment!(:view_count)

        # Lấy thông tin pineapple_crop nếu có
        pineapple_crop_data = nil
        if record.crop_animal_id.present?
          pineapple_crop = ::Farming::PineappleCrop.find_by(id: record.crop_animal_id)
          pineapple_crop_data = pineapple_crop&.as_json(only: [ :id, :name, :variety, :planting_date, :field_id, :current_stage ])
        end

        map_to_entity(record, pineapple_crop_data)
      end

      def list_published(params = {})
        query = ::Marketplace::ProductListing.published

        # Apply filters
        query = query.by_product_type(params[:product_type]) if params[:product_type].present?
        query = query.by_location(params[:province]) if params[:province].present?
        query = query.by_price_range(params[:min_price], params[:max_price]) if params[:min_price].present?
        query = query.ready_to_harvest if params[:ready_to_harvest].present?

        # Apply sorting
        query = apply_sorting(query, params[:sort])

        # Include associations and order
        query = query.includes(:product_images, :user).order(created_at: :desc)

        # Pagination - sửa cách khởi tạo Pagy
        pagy = Pagy.new(
          count: query.count,
        )

        records = query.includes(:product_images)
                        .order(created_at: :desc)
                        .offset(pagy.offset)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def list_by_user(user_id, status = nil, page = 1, per_page = 10)
        query = ::Marketplace::ProductListing.where(user_id: user_id)

        # Apply status filter
        case status
        when "active"
          query = query.published
        when "sold"
          query = query.sold
        when "hidden"
          query = query.hidden
        when "draft"
          query = query.draft
        end

        # Pagination - sửa cách khởi tạo Pagy
        pagy = Pagy.new(
          count: query.count,
          page: page,
          items: per_page
        )

        records = query.includes(:product_images)
                        .order(created_at: :desc)
                        .offset(pagy.offset)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def create(product_listing_entity, images = [])
        # Map entity to ActiveRecord attributes
        attributes = map_entity_to_attributes(product_listing_entity)

        # Start transaction
        ActiveRecord::Base.transaction do
          # Create product listing
          record = ::Marketplace::ProductListing.create!(attributes)

          # Add images if provided
          if images.present?
            images.each_with_index do |image, index|
              # Xử lý image trực tiếp, không cần truy cập qua image_data[:image]
              if image.is_a?(ActionDispatch::Http::UploadedFile)
                # Tạo product image với position
                product_image = record.product_images.create!(position: index + 1)
                # Đính kèm file trực tiếp
                product_image.image.attach(image)
              end
            end
          end

          map_to_entity(record.reload)
        end
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.error("Failed to create product listing: #{e.message}")
        nil
      end

      def update(product_listing_entity, images = [], retained_image_ids = [])
        return nil unless product_listing_entity
        
        # Map entity to ActiveRecord attributes
        attributes = map_entity_to_attributes(product_listing_entity)
        
        # Start transaction
        ActiveRecord::Base.transaction do
          # Find record
          record = ::Marketplace::ProductListing.find_by(id: product_listing_entity.id)
          return nil unless record
          
          # Update attributes
          record.update!(attributes)
          
          # Xử lý retained_image_ids - chuyển đổi thành mảng số nếu cần
          retained_ids = if retained_image_ids.is_a?(Array)
                          retained_image_ids.select(&:present?).map(&:to_i)
                        else
                          []
                        end
            
          # Xóa ảnh không thuộc retained_image_ids
          if retained_ids.any?
            record.product_images.where.not(id: retained_ids).destroy_all
          elsif retained_ids.empty? && images.present?
            # Nếu không có retained_image_ids nhưng có images mới, xóa tất cả images cũ
            record.product_images.destroy_all
          end
          
          # Add new images
          if images.present?
            images.each_with_index do |image, index|
              if image.is_a?(ActionDispatch::Http::UploadedFile)
                # Tạo product image với position
                product_image = record.product_images.create!(position: record.product_images.count + index + 1)
                # Đính kèm file
                product_image.image.attach(image)
              end
            end
          end
          
          # Return updated entity
          map_to_entity(record.reload)
        rescue ActiveRecord::RecordInvalid => e
          Rails.logger.error("Failed to update product listing: #{e.message}")
          nil
        end
      end

      def delete(id)
        record = ::Marketplace::ProductListing.find_by(id: id)
        record&.destroy
      end

      def change_status(id, status)
        record = ::Marketplace::ProductListing.find_by(id: id)
        return nil unless record

        if record.update(status: status)
          map_to_entity(record)
        else
          nil
        end
      end

      def increment_view_count(id)
        record = ::Marketplace::ProductListing.find_by(id: id)
        record&.increment!(:view_count)
        record ? map_to_entity(record) : nil
      end

      def increment_message_count(id)
        record = ::Marketplace::ProductListing.find_by(id: id)
        record&.increment!(:message_count)
        record ? map_to_entity(record) : nil
      end

      def increment_order_count(id)
        record = ::Marketplace::ProductListing.find_by(id: id)
        record&.increment!(:order_count)
        record ? map_to_entity(record) : nil
      end

      private

      def map_to_entity(record, pineapple_crop_data = nil)
        return nil unless record

        Entities::Marketplace::ProductListing.new(
          id: record.id,
          title: record.title,
          description: record.description,
          product_type: record.product_type,
          quantity: record.quantity,
          average_size: record.average_size,
          price_expectation: record.price_expectation,
          status: record.status&.to_sym,
          province: record.province,
          district: record.district,
          ward: record.ward,
          address: record.address,
          latitude: record.latitude,
          longitude: record.longitude,
          user_id: record.user_id,
          crop_animal_id: record.crop_animal_id,
          harvest_start_date: record.harvest_start_date,
          harvest_end_date: record.harvest_end_date,
          view_count: record.view_count,
          message_count: record.message_count,
          order_count: record.order_count,
          location_note: record.location_note,
          total_weight: record.total_weight,
          created_at: record.created_at,
          updated_at: record.updated_at,
          product_images: map_product_images(record.product_images),
          seller_name: record.user&.fullname,
          user_name: record.user&.user_name,
          pineapple_crop_data: pineapple_crop_data
        )
      end

      def map_product_images(product_images)
        product_images.map do |image|
          Entities::Marketplace::ProductImage.new(
            id: image.id,
            image_url: image.image_url,
            position: image.position
          )
        end
      end

      def map_entity_to_attributes(entity)
        {
          title: entity.title,
          description: entity.description,
          product_type: entity.product_type,
          quantity: entity.quantity,
          average_size: entity.average_size,
          price_expectation: entity.price_expectation,
          status: entity.status,
          province: entity.province,
          district: entity.district,
          ward: entity.ward,
          address: entity.address,
          latitude: entity.latitude,
          longitude: entity.longitude,
          user_id: entity.user_id,
          crop_animal_id: entity.crop_animal_id,
          harvest_start_date: entity.harvest_start_date,
          harvest_end_date: entity.harvest_end_date,
          location_note: entity.location_note,
          total_weight: entity.total_weight
        }
      end

      def apply_sorting(query, sort_param)
        case sort_param
        when "newest"
          query.order(created_at: :desc)
        when "oldest"
          query.order(created_at: :asc)
        when "price_asc"
          query.order(price_expectation: :asc)
        when "price_desc"
          query.order(price_expectation: :desc)
        when "harvest_date"
          query.order(harvest_start_date: :asc)
        else
          query.order(created_at: :desc) # default
        end
      end
    end
  end
end
