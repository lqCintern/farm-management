module Formatters
  module Farming
    class PineappleActivityTemplateFormatter
      # Format params cho tạo template
      def self.format_create_params(params, user_id)
        {
          name: params[:name],
          description: params[:description],
          activity_type: params[:activity_type],
          stage: params[:stage],
          duration_days: params[:duration_days],
          user_id: user_id
        }.compact
      end

      # Format params cho cập nhật template
      def self.format_update_params(params)
        {
          name: params[:name],
          description: params[:description],
          activity_type: params[:activity_type],
          stage: params[:stage],
          duration_days: params[:duration_days]
        }.compact
      end

      # Format params cho filter
      def self.format_filter_params(params = {})
        {
          activity_type: params[:activity_type],
          stage: params[:stage]
        }.compact
      end
    end
  end
end 