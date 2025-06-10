class WeatherForecast < ApplicationRecord
  # Cache dữ liệu dự báo thời tiết
  belongs_to :field, optional: true

  # Metadata
  validates :location_name, presence: true
  validates :latitude, presence: true
  validates :longitude, presence: true

  # Bỏ các dòng serialize vì các cột đã là kiểu json trong database
  # serialize :current_data, coder: JSON  <- bỏ dòng này
  # serialize :hourly_forecast, coder: JSON  <- bỏ dòng này
  # serialize :daily_forecast, coder: JSON  <- bỏ dòng này

  # Thời gian dữ liệu được cập nhật lần cuối
  validates :last_updated_at, presence: true

  # Kiểm tra xem dữ liệu có cần được làm mới không (>60 phút thay vì 30 phút)
  def needs_refresh?
    last_updated_at < 60.minutes.ago
  end
end
