module Controllers::Api
  module V1
    module Climate
      class WeatherController < Controllers::Api::BaseController
        before_action :set_field, only: [ :field_forecast ]

        # GET /api/v1/climate/weather/current
        def current
          location = get_location_params

          service = ::Services::Climate::WeatherService.new(
            location[:latitude],
            location[:longitude],
            "metric" # Thay vì current_user.weather_setting&.temperature_unit || 'metric'
          )

          weather_data = service.get_current_weather

          render json: {
            status: "success",
            demo_mode: ::Services::Climate::WeatherService::DEMO_MODE, # Thông báo nếu đang ở chế độ demo
            message: ::Services::Climate::WeatherService::DEMO_MODE ? "Hiển thị dữ liệu demo trong khi chờ API key được kích hoạt" : nil,
            data: weather_data
          }
        end

        # GET /api/v1/climate/weather/forecast
        def forecast
          location = get_location_params

          service = ::Services::Climate::WeatherService.new(
            location[:latitude],
            location[:longitude],
            "metric" # Thay vì current_user.weather_setting&.temperature_unit || 'metric'
          )

          forecast = service.get_and_update_forecast(
            nil,
            location[:name] || "Custom location"
          )

          render json: {
            status: "success",
            demo_mode: ::Services::Climate::WeatherService::DEMO_MODE, # Thông báo nếu đang ở chế độ demo
            message: ::Services::Climate::WeatherService::DEMO_MODE ? "Hiển thị dữ liệu demo trong khi chờ API key được kích hoạt" : nil,
            data: {
              location: {
                name: forecast.location_name,
                latitude: forecast.latitude,
                longitude: forecast.longitude
              },
              current: forecast.current_data,
              hourly: forecast.hourly_forecast,
              daily: forecast.daily_forecast,
              last_updated: forecast.last_updated_at
            }
          }
        end

        # GET /api/v1/climate/weather/field/:id/forecast
        def field_forecast
          # Tính toán điểm trung tâm từ danh sách coordinates
          coordinates = @field.coordinates

          # Kiểm tra nếu không có coordinates
          if coordinates.blank?
            render json: {
              status: "error",
              message: "Không tìm thấy tọa độ cho ruộng này"
            }, status: :unprocessable_entity
            return
          end

          # Tính trung bình các lat và lng để có điểm trung tâm
          total_lat = 0
          total_lng = 0

          coordinates.each do |coord|
            total_lat += coord["lat"].to_f
            total_lng += coord["lng"].to_f
          end

          avg_lat = total_lat / coordinates.size
          avg_lng = total_lng / coordinates.size

          # Sử dụng điểm trung tâm để lấy dữ liệu thời tiết
          service = ::Services::Climate::WeatherService.new(
            avg_lat,
            avg_lng,
            "metric" # Luôn sử dụng metric làm đơn vị mặc định
          )

          forecast = service.get_and_update_forecast(
            @field.id,
            @field.name
          )

          render json: {
            status: "success",
            demo_mode: ::Services::Climate::WeatherService::DEMO_MODE, # Thông báo nếu đang ở chế độ demo
            message: ::Services::Climate::WeatherService::DEMO_MODE ? "Hiển thị dữ liệu demo trong khi chờ API key được kích hoạt" : nil,
            data: {
              field: {
                id: @field.id,
                name: @field.name,
                center: {
                  lat: avg_lat,
                  lng: avg_lng
                }
              },
              location: {
                name: forecast.location_name,
                latitude: forecast.latitude,
                longitude: forecast.longitude
              },
              current: forecast.current_data,
              hourly: forecast.hourly_forecast,
              daily: forecast.daily_forecast,
              last_updated: forecast.last_updated_at
            }
          }
        end

        private

        def set_field
          @field = ::Models::Farming::Field.find(params[:id])
        end

        def get_location_params
          if params[:latitude].present? && params[:longitude].present?
            {
              latitude: params[:latitude],
              longitude: params[:longitude],
              name: params[:location_name]
            }
          else
            # Sử dụng tọa độ mặc định của Ninh Bình thay vì cố gắng truy cập weather_setting
            {
              latitude: 20.2547,
              longitude: 105.9752,
              name: "Ninh Bình"
            }
          end
        end
      end
    end
  end
end
