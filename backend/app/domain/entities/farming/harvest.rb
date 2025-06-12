module Entities
  module Farming
    class Harvest
      attr_accessor :id, :quantity, :harvest_date, :crop_id, :field_id, :farm_activity_id,
                    :coordinates, :user_id, :created_at, :updated_at,
                    :field, :pineapple_crop, :farm_activity, :area

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def calculate_area
        return 0 unless coordinates.present?

        begin
          points = coordinates.map { |coord| Geokit::LatLng.new(coord["lat"].to_f, coord["lng"].to_f) }
          Geokit::Polygon.new(points).area * 10_000 # Chuyển từ km2 sang m2
        rescue => e
          0
        end
      end
    end
  end
end
