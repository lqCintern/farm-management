module Formatters
  module Farming
    class FarmActivityFormatter
      # Format params cho tạo farm activity
      def self.format_create_params(params, user_id)
        {
          activity_type: params[:activity_type],
          description: params[:description],
          frequency: params[:frequency],
          status: params[:status] || "pending",
          start_date: params[:start_date],
          end_date: params[:end_date],
          crop_animal_id: params[:crop_animal_id],
          field_id: params[:field_id],
          coordinates: params[:coordinates],
          materials: params[:materials],
          user_id: user_id
        }.compact
      end

      # Format params cho cập nhật farm activity
      def self.format_update_params(params)
        {
          activity_type: params[:activity_type],
          description: params[:description],
          frequency: params[:frequency],
          status: params[:status],
          start_date: params[:start_date],
          end_date: params[:end_date],
          crop_animal_id: params[:crop_animal_id],
          field_id: params[:field_id],
          coordinates: params[:coordinates],
          materials: params[:materials]
        }.compact
      end

      # Format params cho completion
      def self.format_completion_params(params)
        return {} if params.nil?
        
        {
          actual_notes: params[:actual_notes],
          actual_materials: params[:actual_materials]
        }.compact
      end

      # Format params cho filter
      def self.format_filter_params(params = {})
        {
          start_date: params[:start_date],
          end_date: params[:end_date],
          activity_type: params[:activity_type],
          crop_animal_id: params[:crop_animal_id],
          status: params[:status]
        }.compact
      end

      # Format params cho statistics
      def self.format_statistics_params(params = {})
        {
          period: params[:period] || "month",
          year: params[:year].present? ? params[:year].to_i : Date.today.year,
          month: params[:month].present? ? params[:month].to_i : Date.today.month,
          quarter: params[:quarter].present? ? params[:quarter].to_i : ((Date.today.month - 1) / 3 + 1)
        }
      end
    end
  end
end 