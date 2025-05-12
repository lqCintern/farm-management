require 'rgeo'

class Field < ApplicationRecord
  # Quan hệ
  belongs_to :user
  has_many :pineapple_crop
  has_many :farm_activities
  has_many :harvests
  
  # Validation
  validates :name, presence: true
  validates :coordinates, presence: true
  validates :user_id, presence: true
  
  # Callbacks
  before_save :calculate_area_from_coordinates, if: -> { area.blank? && coordinates_changed? }
  
  # Tính diện tích từ tọa độ
  def calculate_area_from_coordinates
    self.area = calculate_area
  end
  
  # Method để tính diện tích từ tọa độ
def calculate_area
  return 0 unless coordinates.present? && coordinates.size > 2

  # Sử dụng Cartesian factory để tính diện tích
  factory = RGeo::Cartesian.factory

  # Tạo đa giác từ tọa độ
  points = coordinates.map { |coord| factory.point(coord["lng"].to_f, coord["lat"].to_f) }
  polygon = factory.polygon(factory.linear_ring(points))

  # Tính diện tích (m²)
  polygon.area
rescue => e
  Rails.logger.error "Error calculating area with RGeo: #{e.message}"
  0
end
  
  # Kiểm tra cánh đồng có bao phủ một điểm không
  def contains_point?(lat, lng)
    return false unless coordinates.present?

    # Tạo factory để xử lý dữ liệu không gian
    factory = RGeo::Geographic.spherical_factory(srid: 4326)

    # Tạo đa giác từ tọa độ
    points = coordinates.map { |coord| factory.point(coord["lng"].to_f, coord["lat"].to_f) }
    polygon = factory.polygon(factory.linear_ring(points))

    # Kiểm tra điểm có nằm trong đa giác không
    point = factory.point(lng.to_f, lat.to_f)
    polygon.contains?(point)
  rescue => e
    Rails.logger.error "Error checking point containment with RGeo: #{e.message}"
    false
  end
end
