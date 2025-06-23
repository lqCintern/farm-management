module Models
class WeatherSetting < Models::ApplicationRecord
  belongs_to :user

  # Đơn vị nhiệt độ ưa thích (metric, imperial)
  validates :temperature_unit, inclusion: { in: [ "metric", "imperial" ] }

  # Vị trí mặc định khi không xác định được field
  validates :default_latitude, presence: true
  validates :default_longitude, presence: true
  validates :default_location_name, presence: true

  # Cài đặt thông báo thời tiết
  validates :alert_enabled, inclusion: { in: [ true, false ] }
end
end
