
  module Farming
    class PineappleCropPresenter < BasePresenter
      def as_json
        {
          id: @object.id,
          name: @object.name,
          user_id: @object.user_id,
          field_id: @object.field_id,
          planting_date: @object.planting_date,
          harvest_date: @object.harvest_date,
          season_type: @object.season_type,
          planting_density: @object.planting_density,
          status: @object.status,
          description: @object.description,
          variety: @object.variety,
          current_stage: @object.current_stage,
          completion_percentage: @object.completion_percentage,
          expected_yield: @object.expected_yield,
          actual_yield: @object.actual_yield,
          created_at: @object.created_at,
          updated_at: @object.updated_at
        }
      end

      def as_detail
        {
          id: @object.id,
          name: @object.name,
          user_id: @object.user_id,
          field_id: @object.field_id,
          planting_date: @object.planting_date,
          harvest_date: @object.harvest_date,
          land_preparation_date: @object.land_preparation_date,
          tie_date: @object.tie_date,
          flower_treatment_date: @object.flower_treatment_date,
          expected_flower_date: @object.expected_flower_date,
          field_area: @object.field_area,
          season_type: @object.season_type,
          planting_density: @object.planting_density,
          status: @object.status,
          description: @object.description,
          variety: @object.variety,
          source: @object.source,
          current_stage: @object.current_stage,
          current_stage_start_date: @object.current_stage_start_date,
          completion_percentage: @object.completion_percentage,
          expected_yield: @object.expected_yield,
          actual_yield: @object.actual_yield,
          location: @object.location,
          created_at: @object.created_at,
          updated_at: @object.updated_at,
          farm_activities: format_activities(@object.farm_activities)
        }
      end
      
      def format_activities(activities)
        activities.map { |activity| format_activity(activity) }
      end
      
      def format_activity(activity)
        {
          id: activity.id,
          activity_type: activity.activity_type,
          description: activity.description,
          start_date: activity.start_date,
          end_date: activity.end_date,
          status: activity.status,
          completed_at: activity.completed_at,
          field_id: activity.field_id
        }
      end
      
      # Format basic info for product listing
      def as_basic_info
        {
          id: @object.id,
          name: @object.name,
          variety: @object.variety,
          planting_date: @object.planting_date,
          field_id: @object.field_id,
          current_stage: @object.current_stage
        }
      end
      
      # Format collection với phân trang
      def self.present_collection(collection, pagination = nil)
        {
          items: collection.map { |item| new(item).as_json },
          pagination: pagination ? format_pagination(pagination) : nil
        }.compact
      end

      # Format pagination info
      def self.format_pagination(pagy)
        {
          current_page: pagy.page,
          total_pages: pagy.pages,
          total_items: pagy.count
        }
      end
      
      # Format response cho create/update
      def self.format_response(result)
        if result[:success]
          {
            message: result[:message],
            pineapple_crop: new(result[:pineapple_crop]).as_json
          }
        else
          { error: result[:error], errors: result[:errors] }
        end
      end
      
      # Format kế hoạch preview
      def self.format_preview_plan(result)
        if result[:success]
          {
            preview_activities: result[:activities].map { |activity| 
              {
                activity_type: activity.activity_type,
                description: activity.description,
                start_date: activity.start_date,
                end_date: activity.end_date,
                field_id: activity.field_id
              }
            }
          }
        else
          { error: result[:error] }
        end
      end
      
      # Format cho confirm plan response
      def self.format_confirm_plan_response(result)
        if result[:success]
          {
            message: result[:message],
            activities: result[:activities].map { |activity|
              {
                id: activity.id,
                activity_type: activity.activity_type,
                description: activity.description,
                start_date: activity.start_date,
                end_date: activity.end_date,
                status: activity.status,
                field_id: activity.field_id
              }
            }
          }
        else
          { error: result[:error] }
        end
      end
      
      # Format statistics response
      def self.format_statistics(statistics)
        {
          statistics: statistics
        }
      end
    end
  end

