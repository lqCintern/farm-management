module Repositories
  module Farming
    class FarmMaterialRepository
      def find_by_id(id, user_id = nil)
        query = ::Models::Farming::FarmMaterial
        query = query.where(user_id: user_id) if user_id
        record = query.find_by(id: id)
        
        return nil unless record
        map_to_entity(record)
      end

      def find_all(user_id, filters = {})
        query = ::Models::Farming::FarmMaterial.where(user_id: user_id)
        
        # Áp dụng filters
        query = apply_filters(query, filters)
        
        # Sắp xếp mặc định
        query = query.order(name: :asc)
        
        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def find_by_material_id(user_id, material_id)
        record = ::Models::Farming::FarmMaterial
          .where(user_id: user_id, material_id: material_id)
          .first
          
        record ? map_to_entity(record) : nil
      end

      def find_by_user(user_id)
        ::Models::Farming::FarmMaterial.where(user_id: user_id)
      end

      def create(attributes, user_id)
        # Đảm bảo last_updated được thiết lập
        attributes[:last_updated] ||= Time.current
        
        record = ::Models::Farming::FarmMaterial.new(attributes)
        record.user_id = user_id
        
        if record.save
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update(id, attributes, user_id)
        record = ::Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy vật tư" } unless record
        
        if record.update(attributes)
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id, user_id)
        record = ::Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy vật tư" } unless record
        
        # Kiểm tra xem vật tư có đang được sử dụng không
        if record.activity_materials.exists?
          # Chỉ xóa nếu không có hoạt động pending nào sử dụng vật tư này
          has_pending_activities = record.activity_materials.joins(:farm_activity)
                                   .where.not(farm_activities: { status: [:completed, :cancelled] })
                                   .exists?
          
          if has_pending_activities
            return { success: false, error: "Không thể xóa vật tư đang được sử dụng trong các hoạt động chưa hoàn thành" }
          end
        end
        
        if record.destroy
          { success: true }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      private
      
      def apply_filters(query, filters)
        # Lọc theo tên
        query = query.where("name LIKE ?", "%#{filters[:name]}%") if filters[:name].present?
        
        # Lọc theo loại
        query = query.where(category: filters[:category]) if filters[:category].present?
        
        query
      end
      
      def map_to_entity(record)
        return nil unless record
        
        Entities::Farming::FarmMaterial.new(
          id: record.id,
          name: record.name,
          material_id: record.material_id,
          quantity: record.quantity,
          unit: record.unit,
          category: record.category,
          user_id: record.user_id,
          last_updated: record.last_updated,
          created_at: record.created_at,
          updated_at: record.updated_at,
          available_quantity: record.available_quantity,
          activity_materials: record.activity_materials.map { |am| map_activity_material(am) },
          unit_cost: record.respond_to?(:unit_cost) ? record.unit_cost : 0,
          total_cost: record.respond_to?(:total_cost) ? record.total_cost : 0
        )
      end
      
      def map_activity_material(activity_material)
        {
          id: activity_material.id,
          farm_activity_id: activity_material.farm_activity_id,
          planned_quantity: activity_material.planned_quantity,
          actual_quantity: activity_material.actual_quantity
        }
      end
    end
  end
end