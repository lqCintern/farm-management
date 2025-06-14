module Farming
  class FieldPresenter
    def self.as_json(field)
      return {} unless field
      
      {
        id: field.id,
        name: field.name,
        description: field.description,
        location: field.location,
        area: field.area,
        coordinates: field.coordinates,
        activity_count: field.activity_count,
        harvest_count: field.harvest_count,
        currentCrop: present_crop(field.current_crop),
        created_at: field.created_at,
        updated_at: field.updated_at
      }
    end
    
    def self.collection_as_json(fields)
      { data: fields.map { |field| as_json(field) } }
    end
    
    def self.present_crop(crop)
      return nil unless crop
      
      # Serialize the crop minimally
      {
        id: crop.id,
        name: crop.name,
        crop_type: crop.crop_type,
        field_area: crop.field_area,
        planting_date: crop.planting_date,
        harvest_date: crop.harvest_date,
        created_at: crop.created_at,
        updated_at: crop.updated_at,
        user_id: crop.user_id,
        status: crop.status,
        description: crop.description,
        location: crop.location,
        quantity: crop.quantity,
        variety: crop.variety,
        source: crop.source,
        field_id: crop.field_id,
        season_type: crop.season_type,
        planting_density: crop.planting_density,
        land_preparation_date: crop.land_preparation_date,
        expected_flower_date: crop.expected_flower_date,
        actual_flower_date: crop.actual_flower_date,
        current_stage: crop.current_stage,
        current_stage_start_date: crop.current_stage_start_date,
        fertilizer_schedule: crop.fertilizer_schedule,
        flower_treatment_date: crop.flower_treatment_date,
        tie_date: crop.tie_date,
        expected_yield: crop.expected_yield,
        actual_yield: crop.actual_yield,
        completion_percentage: crop.completion_percentage
      }
    end
  end
end
