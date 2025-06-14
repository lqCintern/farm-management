
  module Farming
    class FieldPineappleCropPresenter
      def self.as_json(crop)
        return {} unless crop
        
        {
          id: crop.id,
          name: crop.name,
          season_type: crop.season_type,
          current_stage: crop.current_stage,
          status: crop.status,
          planting_date: crop.planting_date,
          field_area: crop.field_area,
          planting_density: crop.planting_density,
          variety: crop.variety,
          source: crop.source,
          description: crop.description,
          created_at: crop.created_at,
          updated_at: crop.updated_at
        }
      end
      
      def self.collection_as_json(crops)
        { data: crops.map { |crop| as_json(crop) } }
      end
    end
  end

