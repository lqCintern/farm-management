class ApiRendererService
  def self.render_farm_activities(activities, pagy, options = {})
    # Lấy dữ liệu từ serializer
    serialized_data = FarmActivitySerializer.new(activities, options).serializable_hash
    
    # Chuyển đổi từ định dạng JSON:API sang định dạng phẳng hơn
    flattened_activities = serialized_data[:data].map do |item|
      attributes = item[:attributes]
      
      # Thêm ID từ resource vào attributes
      attributes[:id] = item[:id].to_i
      
      # Nếu có include, xử lý chúng
      if serialized_data[:included].present?
        related_materials = serialized_data[:included].select do |included|
          included[:type] == 'activity_material' && 
          included[:relationships][:farm_activity][:data][:id] == item[:id]
        end
        
        attributes[:materials] = related_materials.map do |material|
          material[:attributes].merge(id: material[:id].to_i)
        end
      end
      
      attributes
    end
    
    result = {
      farm_activities: flattened_activities
    }
    
    # Thêm thông tin phân trang nếu có
    if pagy
      result[:pagination] = {
        current_page: pagy.page,
        next_page: pagy.next,
        prev_page: pagy.prev,
        total_pages: pagy.pages,
        total_items: pagy.count
      }
    end
    
    result
  end
end
