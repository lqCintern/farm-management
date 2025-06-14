
  module Farming
    class FarmActivityPresenter
      def self.as_json(activity)
        {
          id: activity.id,
          crop_animal_id: activity.crop_animal_id,
          activity_type: activity.activity_type,
          description: activity.description,
          frequency: activity.frequency,
          status: activity.status,
          start_date: activity.start_date,
          end_date: activity.end_date,
          created_at: activity.created_at,
          updated_at: activity.updated_at,
          user_id: activity.user_id,
          actual_completion_date: activity.actual_completion_date,
          actual_notes: activity.actual_notes,
          parent_activity_id: activity.parent_activity_id,
          field_id: activity.field_id,
          coordinates: activity.coordinates,
          status_details: activity.status_details,
          requires_materials: activity.requires_materials,
          materials: activity.materials,
          actual_materials: activity.actual_materials
        }
      end

      def self.collection_as_json(activities, pagination = nil)
        result = {
          farm_activities: activities.map { |activity| as_json(activity) }
        }

        if pagination
          result[:pagination] = {
            current_page: pagination.page,
            next_page: pagination.next,
            prev_page: pagination.prev,
            total_pages: pagination.pages,
            total_items: pagination.count
          }
        end

        result
      end
    end
  end
