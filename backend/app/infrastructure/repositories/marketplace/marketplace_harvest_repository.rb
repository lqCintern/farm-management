module Repositories
  module Marketplace
    class MarketplaceHarvestRepository
      def find(id)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: id)
        map_to_entity(record) if record
      end

      def find_with_associations(id)
        record = ::Models::Marketplace::MarketplaceHarvest.includes(:product_listing, :trader)
                                                .find_by(id: id)
        map_to_entity(record) if record
      end

      def list_for_farmer(farmer_id, status = nil, page = 1, items_per_page = 10)
        query = ::Models::Marketplace::MarketplaceHarvest.joins(:product_listing)
                                                .where(product_listings: { user_id: farmer_id })
        query = query.where(status: status) if status.present?

        pagy = Pagy.new(count: query.count, page: page, items: items_per_page)
        records = query.includes(:product_listing)
                        .order(scheduled_date: :desc)
                        .offset(pagy.offset)
                        .limit(pagy.items)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def list_for_trader(trader_id, status = nil, page = 1, items_per_page = 10)
        query = ::Models::Marketplace::MarketplaceHarvest.where(trader_id: trader_id)
        query = query.where(status: status) if status.present?

        pagy = Pagy.new(count: query.count, page: page, items: items_per_page)
        records = query.includes(:product_listing)
                        .order(scheduled_date: :desc)
                        .offset(pagy.offset)
                        .limit(pagy.items)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def find_by_product_listing(product_listing_id)
        record = ::Models::Marketplace::MarketplaceHarvest.where(product_listing_id: product_listing_id)
                                                .order(created_at: :desc)
                                                .first
        map_to_entity(record) if record
      end

      def update(harvest_entity)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: harvest_entity.id)
        return nil unless record

        result = record.update(
          scheduled_date: harvest_entity.scheduled_date,
          location: harvest_entity.location,
          notes: harvest_entity.notes,
          estimated_quantity: harvest_entity.estimated_quantity,
          actual_quantity: harvest_entity.actual_quantity,
          estimated_price: harvest_entity.estimated_price,
          final_price: harvest_entity.final_price,
          status: harvest_entity.status,
          payment_date: harvest_entity.payment_date
        )

        result ? map_to_entity(record) : nil
      end

      def delete(id)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: id)
        record&.destroy
      end

      def attach_payment_proof(id, image)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: id)
        return nil unless record && image

        record.payment_proof_image.attach(image)
        record.update(payment_date: Time.current)
        map_to_entity(record)
      end

      def active_for_product(product_listing_id)
        record = ::Models::Marketplace::MarketplaceHarvest
          .where(product_listing_id: product_listing_id)
          .where.not(status: [ 2, 3 ])  # completed: 2, cancelled: 3
          .order(created_at: :desc)
          .first

        map_to_entity(record) if record
      end

      def add_payment_proof(id, payment_proof)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: id)
        return nil unless record

        record.payment_proof_url = payment_proof
        record.payment_date = Time.current
        record.status = "payment_confirmed" if record.status == "completed"

        if record.save
          map_to_entity(record)
        else
          nil
        end
      end

      def create(entity)
        attributes = {
          scheduled_date: entity.scheduled_date,
          location: entity.location,
          notes: entity.notes,
          estimated_quantity: entity.estimated_quantity,
          actual_quantity: entity.actual_quantity, # Thêm từ phiên bản đầu
          estimated_price: entity.estimated_price,
          final_price: entity.final_price, # Thêm từ phiên bản đầu
          status: entity.status || "scheduled",
          trader_id: entity.trader_id,
          product_listing_id: entity.product_listing_id,
          product_order_id: entity.product_order_id # Thêm từ phiên bản đầu
        }

        record = ::Models::Marketplace::MarketplaceHarvest.new(attributes)

        if record.save
          map_to_entity(record)
        else
          # Giữ lại thông tin lỗi
          Rails.logger.error("Failed to create harvest: #{record.errors.full_messages.join(', ')}")
          nil
        end
      end

      def update(entity)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: entity.id)
        return nil unless record

        attributes = {
          scheduled_date: entity.scheduled_date,
          location: entity.location,
          notes: entity.notes,
          estimated_quantity: entity.estimated_quantity,
          actual_quantity: entity.actual_quantity,
          estimated_price: entity.estimated_price,
          final_price: entity.final_price,
          status: entity.status
        }

        if record.update(attributes)
          map_to_entity(record)
        else
          nil
        end
      end

      def delete(id)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: id)
        record&.destroy
        record.destroyed? if record
      end

      # Thêm phương thức này vào repository
      def update_status(id, status, user_id)
        record = ::Models::Marketplace::MarketplaceHarvest.find_by(id: id)
        return { success: false, errors: ["Không tìm thấy đơn thu hoạch"] } unless record
        
        # Kiểm tra quyền
        product_listing = record.product_listing
        unless record.trader_id == user_id || product_listing&.user_id == user_id
          return { success: false, errors: ["Bạn không có quyền cập nhật đơn thu hoạch này"] }
        end
        
        if record.update(status: status)
          { success: true, harvest: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      private

      def map_to_entity(record)
        return nil unless record

        Entities::Marketplace::MarketplaceHarvest.new(
          id: record.id,
          scheduled_date: record.scheduled_date,
          location: record.location,
          notes: record.notes,
          estimated_quantity: record.estimated_quantity,
          actual_quantity: record.actual_quantity,
          estimated_price: record.estimated_price,
          final_price: record.final_price,
          status: record.status,
          payment_proof_url: record.payment_proof_url,
          payment_date: record.payment_date,
          created_at: record.created_at,
          updated_at: record.updated_at,
          trader_id: record.trader_id,
          product_listing_id: record.product_listing_id,
          product_order_id: record.product_order_id,
          farm_activity_id: record.farm_activity_id,
          product_listing: map_product_listing(record.product_listing),
          trader_data: map_user(Models::User.find_by(user_id: record.trader_id)),
          farmer_data: map_user(record.product_listing&.user),
          farm_activity: record.farm_activity ? map_farm_activity(record.farm_activity) : nil
        )
      end

      def map_product_listing(record)
        return nil unless record

        Entities::Marketplace::ProductListing.new(
          id: record.id,
          title: record.title,
          status: record.status,
          product_type: record.product_type,
          quantity: record.quantity,
          price_expectation: record.price_expectation,
          user_id: record.user_id,
          product_images: map_product_images(record.product_images)
        )
      end

      def map_product_images(images)
        return [] unless images

        images.map do |image|
          Entities::Marketplace::ProductImage.new(
            id: image.id,
            image_url: image.image_url,
            position: image.position
          )
        end
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

      def map_farm_activity(farm_activity)
        return nil unless farm_activity

        {
          id: farm_activity.id,
          activity_type: farm_activity.activity_type,
          title: farm_activity.description,
          description: farm_activity.description,
          start_date: farm_activity.start_date,
          end_date: farm_activity.end_date,
          status: farm_activity.status,
          frequency: farm_activity.frequency,
          user_id: farm_activity.user_id,
          field_id: farm_activity.field_id,
          crop_animal_id: farm_activity.crop_animal_id,
          actual_completion_date: farm_activity.actual_completion_date,
          actual_notes: farm_activity.actual_notes,
          parent_activity_id: farm_activity.parent_activity_id,
          coordinates: farm_activity.coordinates,
          created_at: farm_activity.created_at,
          updated_at: farm_activity.updated_at
        }
      end
    end
  end
end
