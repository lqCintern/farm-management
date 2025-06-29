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

      def get_statistics(user_id, filters = {})
        materials = ::Models::Farming::FarmMaterial.where(user_id: user_id)
        
        # Áp dụng filters nếu có
        if filters[:start_date].present? || filters[:end_date].present?
          # Logic filter theo thời gian nếu cần
        end
        
        # Tính toán thống kê cơ bản
        total_materials = materials.count
        total_quantity = materials.sum(:quantity)
        total_cost = materials.sum(:total_cost)
        
        # Thống kê theo loại
        by_category = materials.group(:category).count
        
        # Thống kê vật tư sắp hết
        low_stock = materials.where('quantity <= 10 AND quantity > 0').count
        out_of_stock = materials.where('quantity <= 0').count
        
        # Dữ liệu chi tiết với thông tin ruộng và hoạt động
        details = materials.map do |material|
          # Lấy thông tin sử dụng vật tư từ ActivityMaterial
          activity_materials = material.activity_materials
            .joins(:farm_activity)
            .joins("LEFT JOIN fields ON farm_activities.field_id = fields.id")
            .select("activity_materials.*, 
                    farm_activities.start_date as used_date,
                    farm_activities.description as activity_name,
                    fields.name as field_name")
            .order("farm_activities.start_date DESC")
          
          # Nếu có activity_materials, lấy thông tin từ record đầu tiên
          if activity_materials.any?
            first_usage = activity_materials.first
            {
              id: material.id,
              name: material.name,
              category: material.category,
              quantity: material.quantity,
              unit: material.unit,
              unit_cost: material.unit_cost,
              total_cost: material.total_cost,
              last_updated: material.last_updated,
              used_date: first_usage.used_date,
              activity_name: first_usage.activity_name,
              field_name: first_usage.field_name || "Không có ruộng"
            }
          else
            {
              id: material.id,
              name: material.name,
              category: material.category,
              quantity: material.quantity,
              unit: material.unit,
              unit_cost: material.unit_cost,
              total_cost: material.total_cost,
              last_updated: material.last_updated,
              used_date: nil,
              activity_name: nil,
              field_name: nil
            }
          end
        end
        
        # Dữ liệu theo tháng (giả định)
        monthly_data = []
        
        {
          success: true,
          statistics: {
            total_materials: total_materials,
            total_quantity: total_quantity,
            total_cost: total_cost,
            by_category: by_category,
            low_stock: low_stock,
            out_of_stock: out_of_stock
          },
          details: details,
          monthly_data: monthly_data
        }
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
        
        # Lấy thông tin ảnh từ supply_listing nếu có material_id
        supply_listing_info = nil
        if record.material_id.present?
          supply_listing = ::Models::SupplyChain::SupplyListing.find_by(id: record.material_id)
          if supply_listing
            # Thử lấy ảnh từ Active Storage trước
            main_image_url = supply_listing.main_image_url
            additional_image_urls = supply_listing.additional_image_urls
            
            # Nếu không có ảnh từ Active Storage, thử lấy từ SupplyImage
            if main_image_url.nil? && additional_image_urls.empty?
              supply_images = supply_listing.supply_images.sorted
              if supply_images.any?
                main_image_url = supply_images.first.image_url
                additional_image_urls = supply_images[1..-1].map(&:image_url).compact
              end
            end
            
            supply_listing_info = {
              id: supply_listing.id,
              name: supply_listing.name,
              main_image: main_image_url,
              images: additional_image_urls,
              brand: supply_listing.brand,
              manufacturer: supply_listing.manufacturer
            }
          end
        end
        
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
          total_cost: record.respond_to?(:total_cost) ? record.total_cost : 0,
          supply_listing: supply_listing_info
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