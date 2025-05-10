import { Logo } from "../logo";
import Cart from "../cart";
import SearchBox from "../searchbox";
import Navlinks from "./navlinks";
import { routes } from "@/constants";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/services/authService";
import { authService } from "@/lib/appwrite.config";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function Navbar() {
  const navigate = useNavigate();
  interface UserProfile {
    user_name: string;
    user_type?: string;
    [key: string]: any;
  }

  const [user, setUser] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const cart = useSelector((state: RootState) => state.cartReducer.cart);

  const amount = cart.reduce((total, item) => {
    const itemQuantity = item.quantity ?? 1;
    return total + item.price * itemQuantity;
  }, 0);

  const value = cart.reduce((total, item) => {
    const itemQuantity = item.quantity ?? 1;
    return total + itemQuantity;
  }, 0);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return ""; // Trả về chuỗi rỗng nếu name không hợp lệ
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
        setUserType((userProfile as UserProfile)?.user_type || "farmer"); // Lấy user_type từ profile
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
    fetchUserProfile();
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
    <div className="px-4">
      <div className="md:flex md:justify-between hidden">
        <div className="flex gap-1">
          <img className="w-3" src="/img/location.svg" alt="location" />
          <p className="text-gray-400 text-[10px] mt-1.5">
            Ninh Bình, Việt Nam
          </p>
        </div>
        <div className="flex gap-1 items-center">
          <p className="text-gray-400 text-[12px] mt-2 mr-4 cursor-pointer">
            ENG
          </p>
          <p className="text-gray-400 text-[12px] mt-2 mr-3 cursor-pointer">
            USD
          </p>
          <p className="text-gray-400 text-[12px] mt-2 mr-2">|</p>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {getInitials(user.user_name)} {/* Sử dụng user.user_name */}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 text-[12px] px-1 py-1 border rounded hover:bg-gray-100 bg-[#00B207]"
              >
                SIGN OUT
              </button>
            </div>
          ) : (
            <p
              className="text-gray-400 text-[12px] mt-2 cursor-pointer"
              onClick={() => navigate(routes.login.index)}
            >
              SIGN IN/ SIGN UP
            </p>
          )}
        </div>
      </div>
      <hr className="mt-2 mb-2" />
      <div className="flex justify-between">
        <Logo />
        <div className="hidden md:block">
          <SearchBox />
        </div>
        <Cart
          onClick={() => navigate(routes.cart.index)}
          amount={parseFloat(amount.toFixed(2))}
          value={value}
        />
      </div>
      <div className="mt-3 hidden md:block">
        <Navlinks userType={userType} />
      </div>
    </div>
  );
}
