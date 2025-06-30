module Formatters
  module Farming
    class FarmMaterialFormatter
      # Format params cho tạo farm material
      def self.format_create_params(params, user_id)
        {
          name: params[:name],
          material_id: params[:material_id],
          quantity: params[:quantity],
          unit: params[:unit],
          category: params[:category],
          user_id: user_id
        }.compact
      end

      # Format params cho cập nhật farm material
      def self.format_update_params(params)
        {
          name: params[:name],
          material_id: params[:material_id],
          quantity: params[:quantity],
          unit: params[:unit],
          category: params[:category]
        }.compact
      end

      # Format params cho filter
      def self.format_filter_params(params = {})
        {
          name: params[:name],
          category: params[:category]
        }.compact
      end

      # Format params cho statistics
      def self.format_statistics_params(params = {})
        {
          start_date: params[:start_date],
          end_date: params[:end_date],
          field_id: params[:field_id],
          crop_id: params[:crop_id]
        }.compact
      end
    end
  end
end 