module Services::Farming
  class PlanGeneratorService
    def generate_activities_for_crop(crop_entity)
      # Lấy tất cả templates của user hoặc default templates
      templates = get_all_templates_for_crop(crop_entity)
      
      activities = []
      templates.each do |template|
        # Tính toán ngày bắt đầu dựa trên stage và template
        start_date = calculate_start_date(crop_entity, template)
        end_date = start_date + template.duration_days.days
        
        activities << {
          activity_type: template.activity_type,
          description: template.description || template.name,
          start_date: start_date,
          end_date: end_date,
          field_id: crop_entity.field_id,
          status: :pending,
          stage: template.stage,
          template_id: template.id
        }
      end
      
      activities
    end

    def preview_activities_for_params(crop_params)
      # Lấy tất cả templates của user hoặc default templates
      templates = get_all_templates_for_params(crop_params)
      
      field_id = crop_params[:field_id]
      
      activities = []
      templates.each do |template|
        # Tính toán ngày bắt đầu dựa trên stage và template
        start_date = calculate_start_date_from_params(crop_params, template)
        end_date = start_date + template.duration_days.days
        
        activities << {
          activity_type: template.activity_type,
          description: template.description || template.name,
          start_date: start_date,
          end_date: end_date,
          field_id: field_id,
          status: :pending,
          stage: template.stage,
          template_id: template.id
        }
      end
      
      activities
    end

    private

    def get_all_templates_for_crop(crop_entity)
      # Lấy tất cả templates của user
      user_templates = ::Models::Farming::PineappleActivityTemplate.where(user_id: crop_entity.user_id)
      
      # Nếu không có templates của user, lấy default templates
      if user_templates.empty?
        user_templates = ::Models::Farming::PineappleActivityTemplate.default_templates
      end
      
      # Filter theo season nếu có
      if crop_entity.season_type.present?
        user_templates = user_templates.to_a.select do |t|
          t.season_specific.blank? || 
          t.season_specific == crop_entity.season_type ||
          (t.season_specific == "Xuân-Hè" && crop_entity.season_type == "spring_summer") ||
          (t.season_specific == "Thu-Đông" && crop_entity.season_type == "fall_winter")
        end
      end
      
      user_templates
    end

    def get_all_templates_for_params(crop_params)
      # Lấy tất cả templates của user
      user_id = crop_params[:user_id]
      
      if user_id
        user_templates = ::Models::Farming::PineappleActivityTemplate.where(user_id: user_id)
      else
        user_templates = ::Models::Farming::PineappleActivityTemplate.none
      end
      
      # Nếu không có templates của user, lấy default templates
      if user_templates.empty?
        user_templates = ::Models::Farming::PineappleActivityTemplate.default_templates
      end
      
      # Filter theo season nếu có
      if crop_params[:season_type].present?
        user_templates = user_templates.to_a.select do |t|
          t.season_specific.blank? || 
          t.season_specific == crop_params[:season_type] ||
          (t.season_specific == "Xuân-Hè" && crop_params[:season_type] == "spring_summer") ||
          (t.season_specific == "Thu-Đông" && crop_params[:season_type] == "fall_winter")
        end
      end
      
      user_templates
    end

    def calculate_start_date(crop_entity, template)
      reference_date = crop_entity.get_reference_date_for_stage(template.stage)
      # Nếu không có ngày tham chiếu, fallback về planting_date hoặc Date.today
      reference_date = crop_entity.planting_date if reference_date.nil? && crop_entity.respond_to?(:planting_date)
      reference_date ||= Date.today
      reference_date + template.day_offset.days
    end

    def calculate_start_date_from_params(crop_params, template)
      temp_crop = ::Models::Farming::PineappleCrop.new(crop_params)
      reference_date = temp_crop.get_reference_date_for_stage(template.stage)
      # Nếu không có ngày tham chiếu, fallback về planting_date hoặc Date.today
      planting_date = crop_params[:planting_date].is_a?(String) ? Date.parse(crop_params[:planting_date]) : crop_params[:planting_date]
      reference_date = planting_date if reference_date.nil? && planting_date.present?
      reference_date ||= Date.today
      reference_date + template.day_offset.days
    end
  end
end
