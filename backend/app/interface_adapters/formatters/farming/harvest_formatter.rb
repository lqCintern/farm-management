module Formatters
  module Farming
    class HarvestFormatter
      # Format params cho tạo harvest
      def self.format_create_params(params, user_id)
        {
          quantity: params[:quantity],
          harvest_date: params[:harvest_date],
          crop_id: params[:crop_id],
          field_id: params[:field_id],
          farm_activity_id: params[:farm_activity_id],
          coordinates: params[:coordinates],
          user_id: user_id
        }.compact
      end

      # Format params cho cập nhật harvest
      def self.format_update_params(params)
        {
          quantity: params[:quantity],
          harvest_date: params[:harvest_date],
          crop_id: params[:crop_id],
          field_id: params[:field_id],
          farm_activity_id: params[:farm_activity_id],
          coordinates: params[:coordinates]
        }.compact
      end

      # Format params cho filter
      def self.format_filter_params(params = {})
        {
          start_date: params[:start_date],
          end_date: params[:end_date],
          crop_id: params[:crop_id],
          field_id: params[:field_id]
        }.compact
      end
    end
  end
end 