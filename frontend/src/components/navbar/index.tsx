import { Logo } from "../logo";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/services/users/authService";
import { authService } from "@/lib/appwrite.config";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUnreadCount } from "@/services/notifications/notificationService";
import { BellIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Badge, Tooltip } from "antd";
import { routes } from "@/constants";
import weatherService, { WeatherData } from '@/services/weatherService';
import PineappleImg from "@/assets/pineapple.png";

export default function Navbar() {
  const navigate = useNavigate();
  interface UserProfile {
    user_name: string;
    user_type?: string;
    [key: string]: any;
  }

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const userProfile = await getUserProfile();
        setUser(userProfile as UserProfile);
        setUserType((userProfile as UserProfile)?.user_type || "farmer");
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const response = await getUnreadCount();
        console.log('Unread count response:', response);
        if (response && response.counts) {
          const total = response.counts.total;
          console.log('Setting unread count to:', total);
          console.log('Current unreadNotifications state:', unreadNotifications);
          setUnreadNotifications(total);
          console.log('After setting unreadNotifications state:', total);
        } else {
          console.log('Invalid response structure:', response);
        }
      } catch (error) {
        console.error("Error fetching unread counts:", error);
      }
    };

    fetchUnreadCounts();
    // Refresh counts every minute
    const interval = setInterval(fetchUnreadCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await weatherService.fetchWeatherForecast({});
        if (response && response.status === "success") {
          setWeatherData(response.data);
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      }
    };

    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate(routes.index);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="px-4 bg-white shadow-sm">
      <div className="flex items-center justify-between h-16">
        <img
          src={PineappleImg}
          alt="PineFarm Logo"
          onClick={() => navigate(routes.index)}
          className="h-12 w-auto cursor-pointer select-none hover:opacity-80 transition-opacity"
          style={{ maxHeight: 48 }}
        />
        
        <div className="flex items-center space-x-6">
          {/* Temperature */}
          {weatherData?.current && (
            <div className="flex items-center text-gray-600">
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData.current.weather_icon}@2x.png`}
                alt={weatherData.current.weather_description}
                className="w-8 h-8"
              />
              <span className="text-lg font-medium ml-1">
                {Math.round(weatherData.current.temp)}°C
              </span>
            </div>
          )}

          {/* Notifications */}
          <Tooltip title="Thông báo">
            <button
              onClick={() => navigate("/notifications")}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative"
              style={{ outline: 'none', border: 'none', background: 'transparent' }}
            >
              <BellIcon className="h-6 w-6" />
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 18,
                    height: 18,
                    background: '#f5222d',
                    color: '#fff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                    zIndex: 1000,
                    padding: '0 5px',
                    boxShadow: '0 0 0 2px #fff',
                  }}
                >
                  {unreadNotifications}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Messages */}
          <Tooltip title="Tin nhắn">
            <Badge count={unreadMessages} size="small">
              <button
                onClick={() => navigate("/chat")}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
              </button>
            </Badge>
          </Tooltip>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {getInitials(user.user_name)}
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border rounded-full hover:bg-gray-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border rounded-full hover:bg-gray-50 transition-colors"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
