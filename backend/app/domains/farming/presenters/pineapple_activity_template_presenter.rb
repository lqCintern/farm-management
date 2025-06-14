module Farming
  module Presenters
    class PineappleActivityTemplatePresenter
    def self.as_json(template)
      return {} unless template
      
      {
        id: template.id,
        name: template.name,
        description: template.description,
        activity_type: template.activity_type,
        stage: template.stage,
        day_offset: template.day_offset,
        duration_days: template.duration_days,
        season_specific: template.season_specific,
        is_required: template.is_required,
        user_id: template.user_id,
        created_at: template.created_at,
        updated_at: template.updated_at,
        is_default: template.default?
      }
    end
    
    def self.collection_as_json(templates)
      { data: templates.map { |template| as_json(template) } }
    end
      end
  end
end