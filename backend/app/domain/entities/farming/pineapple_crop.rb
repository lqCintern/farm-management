module Entities
  module Farming
    class PineappleCrop
      attr_reader :id, :name, :user_id, :field_id, :planting_date, :harvest_date,
                 :land_preparation_date, :tie_date, :flower_treatment_date,
                 :expected_flower_date, :field_area, :season_type,
                 :planting_density, :status, :description, :variety, :source,
                 :current_stage, :current_stage_start_date, :completion_percentage,
                 :expected_yield, :actual_yield, :location, :created_at, :updated_at,
                 :farm_activities

      def initialize(attributes = {})
        @id = attributes[:id]
        @name = attributes[:name]
        @user_id = attributes[:user_id]
        @field_id = attributes[:field_id]
        @planting_date = attributes[:planting_date]
        @harvest_date = attributes[:harvest_date]
        @land_preparation_date = attributes[:land_preparation_date]
        @tie_date = attributes[:tie_date]
        @flower_treatment_date = attributes[:flower_treatment_date]
        @expected_flower_date = attributes[:expected_flower_date]
        @field_area = attributes[:field_area]
        @season_type = attributes[:season_type]
        @planting_density = attributes[:planting_density]
        @status = attributes[:status]
        @description = attributes[:description]
        @variety = attributes[:variety]
        @source = attributes[:source]
        @current_stage = attributes[:current_stage]
        @current_stage_start_date = attributes[:current_stage_start_date]
        @completion_percentage = attributes[:completion_percentage] || 0
        @expected_yield = attributes[:expected_yield]
        @actual_yield = attributes[:actual_yield] || 0
        @location = attributes[:location]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @farm_activities = attributes[:farm_activities] || []
      end

      def get_reference_date_for_stage(stage)
        case stage.to_s
        when "preparation"
          land_preparation_date || Date.today
        when "seedling_preparation"
          (land_preparation_date || Date.today) + 15.days
        when "planting"
          planting_date || Date.today
        when "leaf_tying"
          tie_date || (planting_date + 5.months if planting_date.present?)
        when "first_fertilizing"
          planting_date.present? ? (planting_date + 2.months) : Date.today
        when "second_fertilizing"
          planting_date.present? ? (planting_date + 6.months) : Date.today
        when "flower_treatment"
          flower_treatment_date || (planting_date + 10.months if planting_date.present?)
        when "sun_protection"
          expected_flower_date || (planting_date + 12.months if planting_date.present?)
        when "fruit_development"
          expected_flower_date.present? ? (expected_flower_date + 2.months) : Date.today
        when "harvesting"
          harvest_date || Date.today
        when "sprout_collection"
          harvest_date.present? ? (harvest_date + 15.days) : Date.today
        when "field_cleaning"
          harvest_date.present? ? (harvest_date + 1.month) : Date.today
        else
          Date.today
        end
      end
    end
  end
end
