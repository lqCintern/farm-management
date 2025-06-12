module Entities
  module Farming
    class Field
      attr_accessor :id, :name, :description, :location, :area, :coordinates,
                    :user_id, :created_at, :updated_at, :activity_count,
                    :harvest_count, :current_crop

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def contains_point?(lat, lng)
        return false unless coordinates.present?
        
        # Phương thức này có thể được tái sử dụng từ model
        # hoặc được triển khai trực tiếp trong entity nếu cần
        
        begin
          # Tính toán có điểm nằm trong đa giác
          factory = RGeo::Geographic.spherical_factory(srid: 4326)
          
          # Tạo đa giác từ tọa độ
          points = coordinates.map { |coord| factory.point(coord["lng"].to_f, coord["lat"].to_f) }
          polygon = factory.polygon(factory.linear_ring(points))
          
          # Kiểm tra điểm có nằm trong đa giác không
          point = factory.point(lng.to_f, lat.to_f)
          polygon.contains?(point)
        rescue => e
          false
        end
      end

      def calculate_area
        return 0 unless coordinates.present? && coordinates.size > 2
        
        begin
          # Sử dụng Cartesian factory để tính diện tích
          factory = RGeo::Cartesian.factory
          
          # Tạo đa giác từ tọa độ
          points = coordinates.map { |coord| factory.point(coord["lng"].to_f, coord["lat"].to_f) }
          polygon = factory.polygon(factory.linear_ring(points))
          
          # Tính diện tích (m²)
          polygon.area
        rescue => e
          0
        end
      end
    end
  end
end
