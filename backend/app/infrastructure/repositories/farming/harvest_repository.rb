module Repositories
  module Farming
    class HarvestRepository
      def find_by_id(id, user_id = nil)
        query = ::Models::Farming::Harvest
        query = query.where(user_id: user_id) if user_id

        record = query.find_by(id: id)
        return nil unless record

        map_to_entity(record)
      end

      def find_all(user_id, filters = {})
        query = ::Models::Farming::Harvest.where(user_id: user_id)
                      .includes(:pineapple_crop, :field, :farm_activity)

        # Áp dụng filters nếu cần
        query = apply_filters(query, filters)

        # Sắp xếp mặc định
        query = query.order(harvest_date: :desc)

        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def find_by_crop(crop_id, user_id)
        query = ::Models::Farming::Harvest.where(user_id: user_id, crop_id: crop_id)
                      .includes(:field, :farm_activity)
                      .order(harvest_date: :desc)

        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def find_by_field(field_id, user_id)
        query = ::Models::Farming::Harvest.where(user_id: user_id, field_id: field_id)
                      .includes(:pineapple_crop, :farm_activity)
                      .order(harvest_date: :desc)

        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def create(attributes, user_id)
        record = ::Models::Farming::Harvest.new(attributes)
        record.user_id = user_id

        # Tự động lấy field_id từ pineapple_crop nếu không được cung cấp
        if record.field_id.blank? && record.pineapple_crop&.field_id.present?
          record.field_id = record.pineapple_crop.field_id
        end

        if record.save
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update(id, attributes, user_id)
        record = ::Models::Farming::Harvest.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy thu hoạch" } unless record

        if record.update(attributes)
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id, user_id)
        record = ::Models::Farming::Harvest.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy thu hoạch" } unless record

        if record.destroy
          { success: true }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def get_statistics(user_id)
        # Thống kê từ Farming::Harvest
        farming_harvests = ::Models::Farming::Harvest.where(user_id: user_id)
        
        # Thống kê từ MarketplaceHarvest (thu hoạch từ marketplace)
        marketplace_harvests = ::Models::Marketplace::MarketplaceHarvest
          .joins(:product_listing)
          .left_joins(:product_order)
          .where(product_listings: { user_id: user_id })
          .where(status: 'completed')
        
        # Tổng hợp thống kê
        total_quantity = farming_harvests.sum(:quantity) + marketplace_harvests.sum(:actual_quantity)
        total_count = farming_harvests.count + marketplace_harvests.count
        
        # Tính tổng doanh thu harvest marketplace
        total_marketplace_revenue = marketplace_harvests.includes(:product_order).sum do |harvest|
          if harvest.final_price.present?
            harvest.final_price.to_f
          elsif harvest.product_order&.price.present? && harvest.actual_quantity.present?
            # Tính theo actual_quantity thực tế thu hoạch
            harvest.actual_quantity.to_f * harvest.product_order.price.to_f
          else
            0.0
          end
        end
        
        # Thống kê theo thời gian (bao gồm cả 2 nguồn)
        monthly_farming = farming_harvests.group("DATE_FORMAT(harvest_date, '%Y-%m')").sum(:quantity)
        monthly_marketplace = marketplace_harvests.group("DATE_FORMAT(scheduled_date, '%Y-%m')").sum(:actual_quantity)
        
        # Merge monthly stats
        monthly_stats = monthly_farming.merge(monthly_marketplace) { |key, farming_val, marketplace_val| farming_val + marketplace_val }
        
        # Thống kê theo cây trồng
        crop_stats = farming_harvests.joins(:pineapple_crop).group("pineapple_crops.name").sum(:quantity)
        
        # Thống kê theo cánh đồng
        field_stats = farming_harvests.joins(:field).group("fields.name").sum(:quantity)

        # Chi tiết thu hoạch farming
        farming_details = farming_harvests.includes(:pineapple_crop, :field, :farm_activity).map do |harvest|
          {
            id: harvest.id,
            type: 'farming',
            quantity: harvest.quantity,
            harvest_date: harvest.harvest_date,
            field_name: harvest.field&.name,
            crop_name: harvest.pineapple_crop&.name,
            farm_activity_id: harvest.farm_activity_id,
            farm_activity_type: harvest.farm_activity&.activity_type,
            farm_activity_status: harvest.farm_activity&.status,
            created_at: harvest.created_at,
            revenue: 0.0
          }
        end

        # Chi tiết thu hoạch marketplace
        marketplace_details = marketplace_harvests.includes(:product_listing, :product_order, :farm_activity, product_order: :buyer).map do |harvest|
          product_listing = harvest.product_listing
          product_order = harvest.product_order
          revenue = if harvest.final_price.present?
            harvest.final_price.to_f
          elsif harvest.actual_quantity.present? && product_order&.price.present?
            # Tính theo actual_quantity thực tế thu hoạch
            harvest.actual_quantity.to_f * product_order.price.to_f
          else
            0.0
          end
          {
            id: harvest.id,
            type: 'marketplace',
            quantity: harvest.actual_quantity,
            harvest_date: harvest.scheduled_date,
            field_name: product_listing.pineapple_crop&.field&.name || 'Chưa xác định',
            crop_name: product_listing.title,
            order_id: product_order&.id || product_listing.id,
            order_title: product_listing.title,
            buyer_name: product_order&.buyer&.fullname || 'Chưa xác định',
            farm_activity_id: harvest.farm_activity_id,
            farm_activity_type: harvest.farm_activity&.activity_type,
            farm_activity_status: harvest.farm_activity&.status,
            created_at: harvest.created_at,
            revenue: revenue
          }
        end

        {
          success: true,
          monthly: monthly_stats,
          by_crop: crop_stats,
          by_field: field_stats,
          total_quantity: total_quantity,
          harvest_count: total_count,
          farming_harvests: farming_harvests.count,
          marketplace_harvests: marketplace_harvests.count,
          total_revenue: total_marketplace_revenue,
          farming_details: farming_details,
          marketplace_details: marketplace_details
        }
      end

      def get_statistics_by_source(user_id, options = {})
        # Thống kê lượng thu hoạch theo nguồn
        by_source = {
          total: Models::Farming::Harvest.where(user_id: user_id).sum(:quantity),
          direct: Models::Farming::Harvest.where(user_id: user_id, is_marketplace_sale: false).sum(:quantity),
          marketplace: Models::Farming::Harvest.where(user_id: user_id, is_marketplace_sale: true).sum(:quantity)
        }
        
        # Thống kê doanh thu theo nguồn
        revenue = {
          total: Models::Farming::Harvest.where(user_id: user_id)
                    .where.not(sale_price: nil).sum('quantity * sale_price'),
          marketplace: Models::Farming::Harvest.where(user_id: user_id, is_marketplace_sale: true)
                      .where.not(sale_price: nil).sum('quantity * sale_price')
        }
        
        { success: true, by_source: by_source, revenue: revenue }
      end

      private

      def apply_filters(query, filters)
        query = query.where(crop_id: filters[:crop_id]) if filters[:crop_id].present?
        query = query.where(field_id: filters[:field_id]) if filters[:field_id].present?

        if filters[:start_date].present?
          query = query.where("harvest_date >= ?", filters[:start_date])
        end

        if filters[:end_date].present?
          query = query.where("harvest_date <= ?", filters[:end_date])
        end

        query
      end

      def map_to_entity(record)
        return nil unless record

        entity = Entities::Farming::Harvest.new(
          id: record.id,
          quantity: record.quantity,
          harvest_date: record.harvest_date,
          crop_id: record.crop_id,
          field_id: record.field_id,
          farm_activity_id: record.farm_activity_id,
          coordinates: record.coordinates,
          user_id: record.user_id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          area: record.calculate_area
        )

        # Map associations
        if record.association(:pineapple_crop).loaded? && record.pineapple_crop.present?
          entity.pineapple_crop = {
            id: record.pineapple_crop.id,
            name: record.pineapple_crop.name,
            crop_type: record.pineapple_crop.crop_type
          }
        end

        if record.association(:field).loaded? && record.field.present?
          entity.field = {
            id: record.field.id,
            name: record.field.name,
            area: record.field.area
          }
        end

        if record.association(:farm_activity).loaded? && record.farm_activity.present?
          entity.farm_activity = {
            id: record.farm_activity.id,
            activity_type: record.farm_activity.activity_type,
            status: record.farm_activity.status
          }
        end

        entity
      end
    end
  end
end
