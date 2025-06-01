class ApiRendererService
  def self.render_farm_activities(activities, pagy, options = {})
    # Kiểm tra nếu activities là nil hoặc mảng rỗng
    return { farm_activities: [] } if activities.nil? || activities.empty?

    begin
      # Lấy dữ liệu từ serializer
      serialized_data = FarmActivitySerializer.new(activities, options).serializable_hash

      # Kiểm tra nếu serialized_data không có data
      if serialized_data.nil? || !serialized_data[:data]
        Rails.logger.warn("FarmActivitySerializer returned nil or no data")
        return { farm_activities: [] }
      end

      # Đảm bảo data luôn là array
      data_array = serialized_data[:data].is_a?(Array) ? serialized_data[:data] : [ serialized_data[:data] ]
      return { farm_activities: [] } if data_array.empty?

      # Chuyển đổi từ định dạng JSON:API sang định dạng phẳng hơn
      flattened_activities = data_array.map do |item|
        next unless item && item[:attributes]
        attributes = item[:attributes].dup

        # Thêm ID từ resource vào attributes
        attributes[:id] = item[:id].to_i

        # Nếu có include, xử lý chúng
        if serialized_data[:included].present?
          related_materials = serialized_data[:included].select do |included|
            included[:type] == "activity_material" &&
            included.dig(:relationships, :farm_activity, :data, :id) == item[:id]
          end

          attributes[:materials] = related_materials.map do |material|
            material[:attributes].merge(id: material[:id].to_i)
          end
        end

        attributes
      end.compact

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
    rescue => e
      # Log lỗi để debug
      Rails.logger.error("Error in render_farm_activities: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      { farm_activities: [] }
    end
  end
end
