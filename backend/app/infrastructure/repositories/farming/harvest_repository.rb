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
        # Thống kê sản lượng thu hoạch theo thời gian
        monthly_stats = ::Models::Farming::Harvest.where(user_id: user_id)
                                      .group("DATE_FORMAT(harvest_date, '%Y-%m')")
                                      .sum(:quantity)

        # Thống kê theo cây trồng
        crop_stats = ::Models::Farming::Harvest.where(user_id: user_id)
                                    .joins(:pineapple_crop)
                                    .group("pineapple_crops.name")
                                    .sum(:quantity)

        # Thống kê theo cánh đồng
        field_stats = ::Models::Farming::Harvest.where(user_id: user_id)
                                     .joins(:field)
                                     .group("fields.name")
                                     .sum(:quantity)

        {
          success: true,
          monthly: monthly_stats,
          by_crop: crop_stats,
          by_field: field_stats,
          total_quantity: Models::Farming::Harvest.where(user_id: user_id).sum(:quantity),
          harvest_count: Models::Farming::Harvest.where(user_id: user_id).count
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
