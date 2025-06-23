module Services
  class ApiRendererService
    def self.render_farm_activities(activities, pagy = nil, options = {})
      # Kiểm tra nếu activities là nil hoặc mảng rỗng
      return { farm_activities: [] } if activities.nil? || activities.empty?

      # Đảm bảo include materials trong options
      options[:include] ||= []
      options[:include] << :activity_materials unless options[:include].include?(:activity_materials)
      options[:include] << :farm_materials unless options[:include].include?(:farm_materials)

      begin
        # Chuyển đổi activities thành format mong muốn
        activities_array = activities.respond_to?(:to_a) ? activities.to_a : [ activities ].compact

        # Tạo mảng kết quả từng activity
        farm_activities = activities_array.map do |activity|
          # Lấy thuộc tính cơ bản
          result = activity.attributes.symbolize_keys

          # Thêm các thuộc tính tính toán
          result[:status_label] = activity.status_i18n if activity.respond_to?(:status_i18n)

          # Thêm status_details nếu có
          result[:status_details] = {
            starting_soon: (activity.start_date - Date.today) <= 3,
            ending_soon: (activity.end_date - Date.today) <= 3,
            overdue: activity.end_date < Date.today,
            overdue_days: [ 0, (Date.today - activity.end_date).to_i ].max
          }

          # Thêm requires_materials
          required_activities = %w[fertilizing pesticide planting]
          result[:requires_materials] = required_activities.include?(activity.activity_type)

          # Xử lý an toàn cho activity_materials với namespace mới
          begin
            activity_materials = activity.activity_materials.to_a

            # Lấy và thêm materials
            materials = []

            if activity_materials.any?
              materials = activity_materials.map do |am|
                material = am.farm_material
                next unless material

                {
                  id: material.id,
                  name: material.name,
                  quantity: am.planned_quantity,
                  unit: material.unit
                }
              end.compact
            end

            # Gán danh sách materials
            result[:materials] = materials
          rescue => e
            Rails.logger.error("Error processing materials: #{e.message}")
            result[:materials] = []
          end

          result
        end

        # Thêm pagination nếu có
        response = { farm_activities: farm_activities }
        if pagy
          response[:pagination] = pagy_metadata(pagy)
        end

        response
      rescue => e
        Rails.logger.error("Error in render_farm_activities: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        { farm_activities: [] }
      end
    end

    # Helper method để sử dụng với pagy
    def self.pagy_metadata(pagy)
      {
        current_page: pagy.page,
        next_page: pagy.next,
        prev_page: pagy.prev,
        total_pages: pagy.pages,
        total_items: pagy.count
      }
    end
  end
end
