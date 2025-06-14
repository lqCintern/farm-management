
  module Farming
  module Entities
    class PineappleActivityTemplate
      attr_accessor :id, :name, :description, :activity_type, :stage,
                    :day_offset, :duration_days, :season_specific, :is_required,
                    :user_id, :created_at, :updated_at

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def required?
        is_required == true
      end

      def default?
        user_id.nil?
      end
    end
  end
end