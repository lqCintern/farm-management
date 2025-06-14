module Farming
  module Presenters
    class FieldActivityPresenter
      def self.as_json(activity)
        return {} unless activity
        
        {
          id: activity.id,
          activity_type: activity.activity_type,
          description: activity.description,
          start_date: activity.start_date,
          end_date: activity.end_date,
          status: activity.status,
          frequency: activity.frequency,
          pineapple_crop: activity.pineapple_crop ? {
            id: activity.pineapple_crop.id,
            name: activity.pineapple_crop.name,
            current_stage: activity.pineapple_crop.current_stage
          } : nil,
          coordinates: activity.coordinates,
          created_at: activity.created_at,
          updated_at: activity.updated_at
        }
      end
      
      def self.collection_as_json(activities)
        { data: activities.map { |activity| as_json(activity) } }
      end
    end
  end
end
