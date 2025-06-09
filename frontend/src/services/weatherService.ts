import axiosInstance from "@/utils/axiosConfig";

// Định nghĩa các kiểu dữ liệu
export interface WeatherRequestParams {
  fieldId?: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface WeatherData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather_condition: string;
    weather_description: string;
    weather_icon: string;
    clouds: number;
    rain: number;
    uvi: number;
    sunset: number;
    visibility: number;
  };
  hourly: Array<{
    dt: number;
    temp: number;
    weather_condition: string;
    weather_description: string;
    weather_icon: string;
    pop: number;
    wind_speed: number;
    wind_deg: number;
  }>;
  daily: Array<{
    dt: number;
    temp_max: number;
    temp_min: number;
    weather_condition: string;
    weather_description: string;
    weather_icon: string;
    pop: number;
  }>;
  last_updated: string;
}

export interface WeatherSettings {
  temperature_unit: 'metric' | 'imperial';
  default_latitude: number;
  default_longitude: number;
  default_location_name: string;
  alert_enabled: boolean;
  alert_conditions: {
    rain_threshold?: number;
    heat_threshold?: number;
    wind_threshold?: number;
  };
}

const weatherService = {
  // Lấy dữ liệu dự báo thời tiết
  fetchWeatherForecast: async (params: WeatherRequestParams): Promise<any> => {
    try {
      let response;
      if (params.fieldId) {
        response = await axiosInstance.get(`/climate/weather/field/${params.fieldId}/forecast`);
      } else {
        response = await axiosInstance.get('/climate/weather/forecast', {
          params: {
            latitude: params.latitude,
            longitude: params.longitude,
            location_name: params.locationName
          }
        });
      }
      return response.data;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response &&
        "data" in (error as any).response
      ) {
        return (error as any).response.data;
      }
      throw error;
    }
  },

  // Lấy dữ liệu thời tiết hiện tại
  fetchCurrentWeather: async (params: WeatherRequestParams): Promise<any> => {
    try {
      const response = await axiosInstance.get('/climate/weather/current', {
        params: {
          latitude: params.latitude,
          longitude: params.longitude
        }
      });
      return response.data;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response &&
        "data" in (error as any).response
      ) {
        return (error as any).response.data;
      }
      throw error;
    }
  },

  // Lấy cài đặt thời tiết của người dùng
  getWeatherSettings: async (): Promise<any> => {
    try {
      const response = await axiosInstance.get('/climate/weather_settings');
      return response.data;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response
      ) {
        return (error as any).response.data;
      }
      throw error;
    }
  },

  // Cập nhật cài đặt thời tiết
  updateWeatherSettings: async (settings: WeatherSettings): Promise<any> => {
    try {
      const response = await axiosInstance.put('/climate/weather_settings', settings);
      return response.data;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response
      ) {
        return (error as any).response.data;
      }
      throw error;
    }
  },
  
  // Cập nhật vị trí mặc định
  updateDefaultLocation: async (params: {
    latitude: number;
    longitude: number;
    locationName: string;
  }): Promise<any> => {
    try {
      const response = await axiosInstance.put('/climate/weather_settings/default_location', {
        default_latitude: params.latitude,
        default_longitude: params.longitude,
        default_location_name: params.locationName
      });
      return response.data;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response
      ) {
        return (error as any).response.data;
      }
      throw error;
    }
  }
};

export default weatherService;