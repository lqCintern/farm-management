module Formatters
  module Farming
    class PineappleCropFormatter
      # Format params cho tạo vụ trồng dứa
      def self.format_create_params(params, user_id)
        {
          name: params[:name],
          user_id: user_id,
          field_id: params[:field_id],
          planting_date: params[:planting_date],
          harvest_date: params[:harvest_date],
          field_area: params[:field_area],
          season_type: params[:season_type],
          planting_density: params[:planting_density],
          status: params[:status] || "planning",
          description: params[:description],
          variety: params[:variety],
          source: params[:source],
          current_stage: params[:current_stage] || "preparation",
          expected_yield: params[:expected_yield],
          location: params[:location]
        }
      end

      # Format params cho cập nhật vụ trồng
      def self.format_update_params(params)
        {
          name: params[:name],
          field_id: params[:field_id],
          planting_date: params[:planting_date],
          harvest_date: params[:harvest_date],
          field_area: params[:field_area],
          season_type: params[:season_type],
          planting_density: params[:planting_density],
          description: params[:description],
          variety: params[:variety],
          source: params[:source],
          expected_yield: params[:expected_yield],
          location: params[:location]
        }.compact
      end

      # Format params cho filter
      def self.format_filter_params(params = {})
        {
          season_type: params[:season_type],
          field_id: params[:field_id],
          status: params[:status],
          stage: params[:stage]
        }.compact
      end

      # Format params cho hoạt động nông trại
      def self.format_activities_params(activities_params)
        return [] unless activities_params.present?

        activities_params.map do |act|
          {
            activity_type: act[:activity_type],
            description: act[:description],
            start_date: act[:start_date],
            end_date: act[:end_date],
            frequency: act[:frequency] || 0,
            field_id: act[:field_id],
            stage: act[:stage]
          }
        end
      end
    end
  end
end
