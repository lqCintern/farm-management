module Dtos
  module Notification
    class SimpleNamedObject
      attr_reader :name

      def initialize(name)
        @name = name
      end
    end

    class LaborRequestNotificationDto
      attr_accessor :id, :title, :description, :start_date, :end_date,
                    :requesting_household_id, :requesting_household_name,
                    :providing_household_id, :providing_household_name

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def requesting_household
        SimpleNamedObject.new(requesting_household_name || "Hộ không xác định")
      end

      def providing_household
        providing_household_id ? SimpleNamedObject.new(providing_household_name || "Hộ không xác định") : nil
      end

      def class
        SimpleNamedObject.new("Labor::LaborRequest")
      end
    end
  end
end
