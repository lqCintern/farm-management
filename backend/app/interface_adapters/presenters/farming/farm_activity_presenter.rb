module Presenters::Farming
  class FarmActivityPresenter < BasePresenter
    def as_json
      {
        id: @object.id,
        crop_animal_id: @object.crop_animal_id,
        activity_type: @object.activity_type,
        description: @object.description,
        frequency: @object.frequency,
        status: @object.status,
        start_date: @object.start_date,
        end_date: @object.end_date,
        created_at: @object.created_at,
        updated_at: @object.updated_at,
        user_id: @object.user_id,
        actual_completion_date: @object.actual_completion_date,
        actual_notes: @object.actual_notes,
        parent_activity_id: @object.parent_activity_id,
        field_id: @object.field_id,
        coordinates: @object.coordinates,
        status_details: @object.status_details,
        requires_materials: @object.requires_materials,
        materials: @object.materials,
        actual_materials: @object.actual_materials
      }
    end

    def self.collection_as_json(activities, pagination = nil)
      result = {
        farm_activities: activities.map { |activity| new(activity).as_json }
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

    def self.format_response(result)
      if result[:success]
        {
          message: "Farm activity #{result[:action]} successfully",
          data: new(result[:farm_activity]).as_json
        }
      else
        {
          error: result[:error],
          errors: result[:errors]
        }
      end
    end

    def self.format_completion_response(result)
      if result[:success]
        response_data = {
          success: true,
          message: "Hoạt động đã hoàn thành",
          suggestion: result[:suggestion]
        }
        
        if result[:stage_advance_message].present?
          response_data[:stage_advance_message] = result[:stage_advance_message]
        end

        response_data
      else
        {
          success: false,
          error: result[:error]
        }
      end
    end

    def self.format_statistics_response(result)
      if result[:success]
        {
          statistics: result[:statistics]
        }
      else
        {
          error: "Không thể lấy thống kê"
        }
      end
    end
  end
end
