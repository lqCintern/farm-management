module Farming
  module Repositories
    class FarmMaterialRepository
      def find_by_id(id, user_id = nil)
        query = ::Farming::FarmMaterial
        query = query.where(user_id: user_id) if user_id
        record = query.find_by(id: id)
        
        return nil unless record
        map_to_entity(record)
      end

      def find_all(user_id, filters = {})
        query = ::Farming::FarmMaterial.where(user_id: user_id)
        
        # Áp dụng filters
        query = apply_filters(query, filters)
        
        # Sắp xếp mặc định
        query = query.order(name: :asc)
        
        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def create(attributes, user_id)
        record = ::Farming::FarmMaterial.new(attributes)
        record.user_id = user_id
        
        if record.save
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update(id, attributes, user_id)
        record = ::Farming::FarmMaterial.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy vật tư" } unless record
        
        if record.update(attributes)
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id, user_id)
        record = ::Farming::FarmMaterial.where(user_id: user_id).find_by(id: id)
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

      # Method from Supply Chain module
      def find_or_create_from_order(user_id, supply_listing, order_quantity)
        begin
          ActiveRecord::Base.transaction do
            # Tìm hoặc tạo farm_material tương ứng
            farm_material = ::Farming::FarmMaterial.find_or_initialize_by(
              user_id: user_id,
              name: supply_listing[:name],
              unit: supply_listing[:unit],
              category: supply_listing[:category]
            )
            
            if farm_material.new_record?
              # Nếu là vật tư mới
              farm_material.quantity = order_quantity
              farm_material.material_id = supply_listing[:id] # Lưu id của supply_listing gốc
              farm_material.last_updated = Time.current
              
              if farm_material.save
                { 
                  success: true, 
                  farm_material: map_to_entity(farm_material), 
                  message: "Đã thêm vào kho vật tư nông trại" 
                }
              else
                raise ActiveRecord::Rollback
                { success: false, errors: farm_material.errors.full_messages }
              end
            else
              # Nếu đã có vật tư, cộng thêm số lượng
              farm_material.increment!(:quantity, order_quantity)
              farm_material.update(last_updated: Time.current)
              
              { 
                success: true, 
                farm_material: map_to_entity(farm_material), 
                message: "Đã cập nhật kho vật tư nông trại" 
              }
            end
          end
        rescue => e
          { success: false, errors: ["Lỗi khi cập nhật kho vật tư: #{e.message}"] }
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
          activity_materials: record.activity_materials.map { |am| map_activity_material(am) }
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