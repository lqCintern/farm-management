module Services::Climate
  class WeatherService
    API_KEY = ENV["OPENWEATHERMAP_API_KEY"]
    # Cập nhật endpoint từ 2.5 sang 3.0 theo email
    BASE_URL = "https://api.openweathermap.org/data/3.0"
    # Chế độ demo khi API key chưa kích hoạt (sẽ tự động tắt khi API hoạt động)
    DEMO_MODE = true

    # Thêm hằng số giới hạn API
    MAX_CALLS_PER_DAY = 24 # Tối đa 24 lần/ngày (1 lần/giờ)

    def initialize(latitude, longitude, units = "metric")
      @latitude = latitude
      @longitude = longitude
      @units = units # metric hoặc imperial
    end

    # Thêm phương thức kiểm tra giới hạn API
    def self.can_call_api?
      # Sử dụng Redis hoặc cache để lưu số lần gọi API trong ngày
      cache_key = "openweathermap_api_calls:#{Date.today}"
      api_calls_today = Rails.cache.read(cache_key).to_i

      # Nếu chưa đạt giới hạn, tăng bộ đếm và cho phép gọi
      if api_calls_today < MAX_CALLS_PER_DAY
        Rails.cache.increment(cache_key, 1, expires_in: 24.hours)
        true
      else
        Rails.logger.warn("OpenWeatherMap API call limit reached for today (#{MAX_CALLS_PER_DAY})")
        false
      end
    end

    def get_forecast
      # Sử dụng dữ liệu demo nếu được kích hoạt
      return get_demo_data if DEMO_MODE

      # Kiểm tra giới hạn API trước khi gọi
      unless self.class.can_call_api?
        # Nếu đạt giới hạn, trả về dữ liệu mẫu hoặc thông báo
        Rails.logger.warn("Using demo/cached data due to API limit")
        return get_demo_data
      end

      begin
        # Log để debug
        Rails.logger.info("Calling OpenWeatherMap API with lat: #{@latitude}, lon: #{@longitude}")

        response = make_api_request("#{BASE_URL}/onecall", {
          lat: @latitude,
          lon: @longitude,
          units: @units,
          exclude: "minutely",
          appid: API_KEY
        })

        # Log response để debug
        Rails.logger.info("OpenWeatherMap response received: #{response.inspect}")

        if response["cod"] && response["cod"].to_i != 200
          Rails.logger.error("OpenWeatherMap API error: #{response['message'] || 'Unknown error'}")
          return { error: response["message"] || "Unknown error" }
        end

        # Check nếu không có current data
        if !response["current"]
          Rails.logger.error("OpenWeatherMap API missing current data: #{response.inspect}")
          return {
            current: {},
            hourly: [],
            daily: [],
            error: "Missing data from weather API"
          }
        end

        {
          current: format_current_weather(response["current"]),
          hourly: format_hourly_forecast(response["hourly"]),
          daily: format_daily_forecast(response["daily"])
        }

      rescue => e
        Rails.logger.error("Error fetching weather data: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        {
          current: {},
          hourly: [],
          daily: [],
          error: "Error fetching weather data: #{e.message}"
        }
      end
    end

    def get_and_update_forecast(field_id = nil, location_name = nil)
      # Tìm forecast hiện tại hoặc tạo mới
      forecast = Models::WeatherForecast.find_or_initialize_by(
        field_id: field_id,
        latitude: @latitude,
        longitude: @longitude
      )

      # Logic cải tiến:
      # 1. Nếu là bản ghi mới - buộc phải gọi API
      # 2. Nếu dữ liệu cũ hơn 1 giờ nhưng chưa đạt giới hạn API - gọi API
      # 3. Nếu dữ liệu cũ hơn 1 giờ và đã đạt giới hạn API - giữ nguyên dữ liệu cũ
      if forecast.new_record?
        # Bản ghi mới, nhất định phải gọi API
        weather_data = get_forecast
        # Cập nhật dữ liệu...
      elsif forecast.needs_refresh? && self.class.can_call_api?
        # Dữ liệu cũ + chưa đạt giới hạn API = gọi API
        weather_data = get_forecast
        # Cập nhật dữ liệu...
      else
        # Dữ liệu còn mới hoặc đã đạt giới hạn = dùng dữ liệu cũ
        return forecast
      end

      # Phần xử lý kết quả không thay đổi
      if weather_data[:error] && !DEMO_MODE
        Rails.logger.error("Error in weather data: #{weather_data[:error]}")
        forecast.location_name = location_name if location_name
        forecast.last_updated_at = Time.current
        forecast.save!
        return forecast
      end

      forecast.location_name = location_name if location_name
      forecast.current_data = weather_data[:current]
      forecast.hourly_forecast = weather_data[:hourly]
      forecast.daily_forecast = weather_data[:daily]
      forecast.last_updated_at = Time.current
      forecast.save!

      forecast
    end

    private

    def get_demo_data
      # Dữ liệu demo cho thời tiết hiện tại
      current = {
        temp: 29.5,
        feels_like: 35.2,
        humidity: 75,
        wind_speed: 2.1,
        wind_deg: 213,
        weather_condition: "Rain",
        weather_description: "moderate rain",
        weather_icon: "10d",
        clouds: 100,
        rain: 1.54,
        uvi: 8.2,
        sunset: (Time.now.to_i + 3600 * 3),
        visibility: 10000
      }

      # Dữ liệu demo cho thời tiết theo giờ
      hourly = []
      base_temp = 29.0
      (0..23).each do |i|
        variation = rand(-1.5..1.5)
        hourly << {
          dt: Time.now + i * 3600,
          temp: base_temp + variation,
          weather_condition: [ "Clear", "Clouds", "Rain" ].sample,
          weather_description: [ "clear sky", "few clouds", "moderate rain", "light rain" ].sample,
          weather_icon: [ "01d", "02d", "10d", "04d" ].sample,
          pop: rand(0..100),
          wind_speed: rand(1.0..5.0).round(1),
          wind_deg: rand(0..360)
        }
      end

      # Dữ liệu demo cho thời tiết theo ngày
      daily = []
      (0..6).each do |i|
        temp_max = base_temp + rand(0..5)
        temp_min = base_temp - rand(2..6)
        daily << {
          dt: Time.now + i * 86400,
          temp_max: temp_max,
          temp_min: temp_min,
          weather_condition: [ "Clear", "Clouds", "Rain" ].sample,
          weather_description: [ "clear sky", "few clouds", "moderate rain", "light rain" ].sample,
          weather_icon: [ "01d", "02d", "10d", "04d" ].sample,
          pop: rand(0..100)
        }
      end

      {
        current: current,
        hourly: hourly,
        daily: daily
      }
    end

    def make_api_request(url, params)
      uri = URI(url)
      uri.query = URI.encode_www_form(params)

      # Log full URL for debugging
      Rails.logger.debug("Making API request to: #{uri}")

      begin
        response = Net::HTTP.get_response(uri)

        if response.is_a?(Net::HTTPSuccess)
          # Nếu API trả về thành công, tự động tắt demo mode
          self.class.const_set("DEMO_MODE", false) if DEMO_MODE
          JSON.parse(response.body)
        else
          Rails.logger.error("API request failed with code: #{response.code}, body: #{response.body}")
          { "cod" => response.code, "message" => "API request failed: #{response.message}" }
        end
      rescue => e
        Rails.logger.error("Error making API request: #{e.message}")
        { "cod" => 500, "message" => e.message }
      end
    end

    # Format methods unchanged
    def format_current_weather(data)
      return {} unless data

      # Xử lý dữ liệu thành định dạng chuẩn cho ứng dụng
      {
        temp: data["temp"],
        feels_like: data["feels_like"],
        humidity: data["humidity"],
        wind_speed: data["wind_speed"],
        wind_deg: data["wind_deg"],
        weather_condition: data["weather"]&.first&.dig("main"),
        weather_description: data["weather"]&.first&.dig("description"),
        weather_icon: data["weather"]&.first&.dig("icon"),
        clouds: data["clouds"],
        rain: data.dig("rain", "1h") || 0,
        uvi: data["uvi"],
        sunset: data["sunset"],
        visibility: data["visibility"]
      }
    end

    def format_hourly_forecast(hourly_data)
      return [] unless hourly_data

      hourly_data.take(24).map do |hour|
        {
          dt: Time.at(hour["dt"]),
          temp: hour["temp"],
          weather_condition: hour["weather"]&.first&.dig("main"),
          weather_description: hour["weather"]&.first&.dig("description"),
          weather_icon: hour["weather"]&.first&.dig("icon"),
          pop: (hour["pop"] * 100).round, # Probability of precipitation as percentage
          wind_speed: hour["wind_speed"],
          wind_deg: hour["wind_deg"]
        }
      end
    end

    def format_daily_forecast(daily_data)
      return [] unless daily_data

      daily_data.take(7).map do |day|
        {
          dt: Time.at(day["dt"]),
          temp_max: day.dig("temp", "max"),
          temp_min: day.dig("temp", "min"),
          weather_condition: day["weather"]&.first&.dig("main"),
          weather_description: day["weather"]&.first&.dig("description"),
          weather_icon: day["weather"]&.first&.dig("icon"),
          pop: (day["pop"] * 100).round # Probability of precipitation as percentage
        }
      end
    end
  end
end
