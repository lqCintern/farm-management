module Formatters
  module Farming
    class FieldFormatter
      # Format params cho tạo field
      def self.format_create_params(params, user_id)
        {
          name: params[:name],
          description: params[:description],
          location: params[:location],
          area: params[:area],
          coordinates: params[:coordinates],
          user_id: user_id
        }.compact
      end

      # Format params cho cập nhật field
      def self.format_update_params(params)
        {
          name: params[:name],
          description: params[:description],
          location: params[:location],
          area: params[:area],
          coordinates: params[:coordinates]
        }.compact
      end

      # Format params cho filter
      def self.format_filter_params(params = {})
        {
          name: params[:name],
          location: params[:location]
        }.compact
      end
    end
  end
end 