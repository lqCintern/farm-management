
  module Farming
    class FieldHarvestPresenter
      def self.as_json(harvest)
        return {} unless harvest
        
        {
          id: harvest.id,
          quantity: harvest.quantity,
          harvest_date: harvest.harvest_date,
          pineapple_crop: harvest.pineapple_crop ? {
            id: harvest.pineapple_crop.id,
            name: harvest.pineapple_crop.name,
            current_stage: harvest.pineapple_crop.current_stage
          } : nil,
          coordinates: harvest.coordinates,
          created_at: harvest.created_at,
          updated_at: harvest.updated_at
        }
      end
      
      def self.collection_as_json(harvests)
        { data: harvests.map { |harvest| as_json(harvest) } }
      end
    end
  end

