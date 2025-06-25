module Repositories
  module Farming
    class PineappleActivityTemplateRepository
      def find_by_id(id)
        record = ::Models::Farming::PineappleActivityTemplate.find_by(id: id)
        return nil unless record
        map_to_entity(record)
      end

      def find_all(user_id = nil, filters = {})
        # Lấy cả templates mặc định và của user
        default_templates = ::Models::Farming::PineappleActivityTemplate.default_templates.to_a
        user_templates = user_id ? ::Models::Farming::PineappleActivityTemplate.where(user_id: user_id).to_a : []

        all_templates = default_templates + user_templates

        # Áp dụng filters
        if filters[:stage].present?
          all_templates.select! { |t| t.stage.to_s == filters[:stage] }
        end

        if filters[:activity_type].present?
          all_templates.select! { |t| t.activity_type.to_s == filters[:activity_type] }
        end

        if filters[:is_required].present?
          all_templates.select! { |t| t.is_required == filters[:is_required] }
        end

        if filters[:season_specific].present?
          all_templates.select! { |t| t.season_specific.nil? || t.season_specific == filters[:season_specific] }
        end

        # Sắp xếp theo stage và day_offset
        all_templates.sort_by! { |t| [ t.stage, t.day_offset ] }

        {
          templates: all_templates,
          entities: all_templates.map { |record| map_to_entity(record) }
        }
      end

      def create(attributes, user_id)
        materials = attributes.delete(:materials)
        
        record = ::Models::Farming::PineappleActivityTemplate.new(attributes)
        record.user_id = user_id

        ActiveRecord::Base.transaction do
          if record.save
            # Xử lý materials nếu có
            if materials.present?
              materials.each do |material_id, quantity|
                record.template_activity_materials.create!(
                  farm_material_id: material_id.to_i,
                  quantity: quantity.to_f
                )
              end
            end
            
            map_to_entity(record)
          else
            { success: false, errors: record.errors.full_messages }
          end
        end
      end

      def update(id, attributes, user_id)
        record = ::Models::Farming::PineappleActivityTemplate.find_by(id: id)
        return { success: false, error: "Không tìm thấy mẫu hoạt động" } unless record

        # Kiểm tra quyền chỉnh sửa
        if record.user_id.nil? || record.user_id != user_id
          return { success: false, error: "Không có quyền sửa mẫu này" }
        end

        if record.update(attributes)
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id, user_id)
        record = ::Models::Farming::PineappleActivityTemplate.find_by(id: id)
        return { success: false, error: "Không tìm thấy mẫu hoạt động" } unless record

        # Kiểm tra quyền xóa
        if record.user_id.nil? || record.user_id != user_id
          return { success: false, error: "Không có quyền xóa mẫu này" }
        end

        if record.destroy
          { success: true }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def create_activity_from_template(template_id, crop_id, user_id)
        template = ::Models::Farming::PineappleActivityTemplate.find_by(id: template_id)
        return { success: false, error: "Không tìm thấy mẫu hoạt động" } unless template

        crop = ::Models::Farming::PineappleCrop.where(user_id: user_id).find_by(id: crop_id)
        return { success: false, error: "Không tìm thấy vụ dứa" } unless crop

        # Tính ngày bắt đầu dựa trên ngày bắt đầu giai đoạn hiện tại của cây trồng
        reference_date = crop.current_stage_start_date || crop.planting_date
        start_date = reference_date + template.day_offset.days
        end_date = start_date + template.duration_days.days

        # Kiểm tra các vật tư cần thiết
        materials_data = {}
        material_errors = []
        
        template.template_activity_materials.includes(:farm_material).each do |template_material|
          farm_material = ::Models::Farming::FarmMaterial.where(user_id: user_id)
                       .find_by(id: template_material.farm_material_id)
          
          unless farm_material
            material_errors << "Không tìm thấy vật tư #{template_material.farm_material.name}"
            next
          end
          
          if farm_material.available_quantity < template_material.quantity
            material_errors << "Không đủ #{farm_material.name} (cần: #{template_material.quantity}, còn: #{farm_material.available_quantity} #{farm_material.unit})"
            next
          end
          
          materials_data[farm_material.id] = template_material.quantity
        end
        
        # Nếu thiếu vật tư, báo lỗi
        if material_errors.any?
          return { success: false, errors: material_errors }
        end

        ActiveRecord::Base.transaction do
          # Tạo activity mới
          activity = ::Models::Farming::FarmActivity.new(
            user_id: crop.user_id,
            crop_animal_id: crop.id,
            field_id: crop.field_id,
            activity_type: template.activity_type,
            description: template.name,
            status: "pending",
            start_date: start_date,
            end_date: end_date,
            frequency: "once"
          )
          
          # Tạm thời bỏ qua validate để có thể xử lý vật tư sau
          activity.skip_materials_check = true
          activity.save!
          
          # Xử lý vật tư
          materials_data.each do |material_id, quantity|
            farm_material = ::Models::Farming::FarmMaterial.find(material_id)
            
            # Tạo liên kết vật tư
            activity.activity_materials.create!(
              farm_material_id: material_id,
              planned_quantity: quantity
            )
            
            # Trừ số lượng vật tư trong kho
            farm_material.update!(quantity: farm_material.quantity - quantity)
          end
          
          # Trả về hoạt động đã tạo
          {
            success: true,
            farm_activity: Repositories::Farming::FarmActivityRepository.new.send(:map_to_entity, activity)
          }
        rescue => e
          { success: false, errors: [e.message] }
        end
      end

      private

      def map_to_entity(record)
        materials = record.template_activity_materials.includes(:farm_material).map do |tam|
          {
            id: tam.farm_material.id,
            name: tam.farm_material.name,
            quantity: tam.quantity,
            unit: tam.farm_material.unit
          }
        end
        
        Entities::Farming::PineappleActivityTemplate.new(
          id: record.id,
          name: record.name,
          description: record.description,
          activity_type: record.activity_type,
          stage: record.stage,
          day_offset: record.day_offset,
          duration_days: record.duration_days,
          season_specific: record.season_specific,
          is_required: record.is_required,
          user_id: record.user_id,
          created_at: record.created_at,
          updated_at: record.updated_at,
          materials: materials
        )
      end
    end
  end
end
