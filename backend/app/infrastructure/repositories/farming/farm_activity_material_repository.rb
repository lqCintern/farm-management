module Repositories
  module Farming
    class FarmActivityMaterialRepository
      def find_by_material_id(material_id, user_id = nil)
        query = ::Models::Farming::ActivityMaterial.where(farm_material_id: material_id)
        if user_id
          query = query.joins(:farm_activity).where(farm_activities: { user_id: user_id })
        end
        query.includes(:farm_activity).order('farm_activities.start_date DESC')
      end

      def map_activities_to_dto(activities)
        activities.map do |activity_material|
          activity = activity_material.farm_activity
          field = activity.field
          
          {
            id: activity_material.id,
            activity_id: activity.id,
            planned_quantity: activity_material.planned_quantity,
            actual_quantity: activity_material.actual_quantity,
            activity_name: activity.description,
            activity_type: activity.activity_type,
            start_date: activity.start_date,
            end_date: activity.end_date,
            status: activity.status,
            field_name: field&.name,
            field_id: field&.id,
            crop_id: activity.crop_animal_id,
            created_at: activity_material.created_at
          }
        end
      end

      def apply_date_filters(query, filters)
        if filters[:start_date].present? && filters[:end_date].present?
          start_date = Date.parse(filters[:start_date])
          end_date = Date.parse(filters[:end_date])
          
          query = query.where(farm_activities: { 
            start_date: start_date..end_date 
          }).or(
            query.where(farm_activities: { 
              end_date: start_date..end_date 
            })
          )
        end
        query
      end
      
      def apply_field_filter(query, filters)
        if filters[:field_id].present?
          query = query.where(farm_activities: { field_id: filters[:field_id] })
        end
        query
      end
      
      def apply_crop_filter(query, filters)
        if filters[:crop_id].present?
          query = query.where(farm_activities: { crop_animal_id: filters[:crop_id] })
        end
        query
      end
    end
  end
end