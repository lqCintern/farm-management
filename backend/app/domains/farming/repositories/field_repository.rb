module Repositories
  module Farming
    class FieldRepository
      def find_by_id(id, user_id = nil)
        query = ::Farming::Field
        query = query.where(user_id: user_id) if user_id
        
        record = query.find_by(id: id)
        return nil unless record
        
        map_to_entity(record)
      end

      def find_all(user_id, filters = {})
        query = ::Farming::Field.where(user_id: user_id)
        
        # Áp dụng filters nếu cần
        query = apply_filters(query, filters)
        
        # Sắp xếp mặc định
        query = query.order(created_at: :desc)
        
        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def create(attributes, user_id)
        record = ::Farming::Field.new(attributes)
        record.user_id = user_id
        
        # Tính diện tích tự động nếu cần
        if attributes[:area].blank? && attributes[:coordinates].present?
          record.area = calculate_area_from_coordinates(attributes[:coordinates])
        end
        
        if record.save
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update(id, attributes, user_id)
        record = ::Farming::Field.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy cánh đồng" } unless record
        
        # Tính diện tích tự động nếu có thay đổi tọa độ và không cung cấp diện tích mới
        if attributes[:coordinates].present? && attributes[:area].blank?
          attributes[:area] = calculate_area_from_coordinates(attributes[:coordinates])
        end
        
        if record.update(attributes)
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id, user_id)
        record = ::Farming::Field.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy cánh đồng" } unless record
        
        # Kiểm tra liên kết
        if record.pineapple_crops.exists? || record.farm_activities.exists? || record.harvests.exists?
          return { 
            success: false, 
            error: "Không thể xóa cánh đồng. Cánh đồng đã có vụ trồng, hoạt động hoặc thu hoạch." 
          }
        end
        
        if record.destroy
          { success: true }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def find_activities(id, user_id)
        field = ::Farming::Field.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy cánh đồng" } unless field
        
        activities = field.farm_activities
                         .includes(:pineapple_crop, :user)
                         .order(start_date: :desc)
        
        {
          success: true,
          records: activities,
          field_name: field.name
        }
      end

      def find_harvests(id, user_id)
        field = ::Farming::Field.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy cánh đồng" } unless field
        
        harvests = field.harvests
                      .includes(:pineapple_crop, :user)
                      .order(harvest_date: :desc)
        
        {
          success: true,
          records: harvests,
          field_name: field.name
        }
      end

      def find_pineapple_crops(id, user_id)
        field = ::Farming::Field.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy cánh đồng" } unless field
        
        pineapple_crops = field.pineapple_crops
        
        {
          success: true,
          records: pineapple_crops,
          field_name: field.name
        }
      end

      def get_statistics(user_id)
        # Thống kê theo diện tích
        total_area = ::Farming::Field.where(user_id: user_id).sum(:area)
        
        # Thống kê theo vụ trồng dứa
        crops_by_field = ::Farming::Field.where(user_id: user_id)
                                      .joins(:pineapple_crops)
                                      .group("farming_fields.id")
                                      .count("farming_pineapple_crops.id")
        
        # Thống kê hoạt động
        activities_by_field = ::Farming::Field.where(user_id: user_id)
                                          .joins(:farm_activities)
                                          .group("farming_fields.id")
                                          .count("farming_farm_activities.id")
        
        # Thống kê thu hoạch
        harvests_by_field = ::Farming::Field.where(user_id: user_id)
                                        .joins(:harvests)
                                        .group("farming_fields.id")
                                        .sum("farming_harvests.quantity")
        
        {
          success: true,
          total_fields: ::Farming::Field.where(user_id: user_id).count,
          total_area: total_area,
          crops_by_field: crops_by_field,
          activities_by_field: activities_by_field,
          harvests_by_field: harvests_by_field
        }
      end

      private
      
      def apply_filters(query, filters)
        # Áp dụng filters nếu cần
        query = query.where("name LIKE ?", "%#{filters[:name]}%") if filters[:name].present?
        query = query.where("location LIKE ?", "%#{filters[:location]}%") if filters[:location].present?
        
        query
      end
      
      def calculate_area_from_coordinates(coordinates)
        return 0 unless coordinates.present? && coordinates.size > 2
        
        begin
          # Sử dụng Cartesian factory để tính diện tích
          factory = RGeo::Cartesian.factory
          
          # Tạo đa giác từ tọa độ
          points = coordinates.map { |coord| factory.point(coord["lng"].to_f, coord["lat"].to_f) }
          polygon = factory.polygon(factory.linear_ring(points))
          
          # Tính diện tích (m²)
          polygon.area
        rescue => e
          0
        end
      end
      
      def map_to_entity(record)
        return nil unless record
        
        # Map current crop
        current_crop = record.pineapple_crops.first
        
        Entities::Farming::Field.new(
          id: record.id,
          name: record.name,
          description: record.description,
          location: record.location,
          area: record.area,
          coordinates: record.coordinates,
          user_id: record.user_id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          activity_count: record.farm_activities.is_a?(ActiveRecord::Relation) ? record.farm_activities.count : 0,
          harvest_count: record.harvests.count,
          current_crop: current_crop
        )
      end
    end
  end
end
