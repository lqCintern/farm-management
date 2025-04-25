class Harvest < ApplicationRecord
  # Quan hệ
  belongs_to :user, foreign_key: :user_id
  belongs_to :crop_animal, foreign_key: :crop_id

  # Validation
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :harvest_date, presence: true
  validates :coordinates, presence: true # Đảm bảo tọa độ được cung cấp

  # Custom method để tính diện tích từ tọa độ
  def calculate_area
    return 0 unless coordinates.present?

    points = coordinates.map { |coord| Geokit::LatLng.new(coord["lat"], coord["lng"]) }
    Geokit::Polygon.new(points).area * 10_000 # Chuyển từ km2 sang m2
  end
end
