import React from "react";
import { useNavigate } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

// Cấu hình navlinksConfig
const navlinksConfig: Record<string, any[]> = {
  farmer: [
    {
      id: 1,
      name: "Home",
      subLinks: [
        { name: "Lịch trình", href: "/calendar" },
        { name: "Trò chuyện", href: "/chat" },
        { name: "Theo dõi cánh đồng", href: "/fields" },
        { name: "Các mùa vụ", href: "/pineapple" },
      ],
    },
    {
      id: 2,
      name: "Activity",
      subLinks: [
        { name: "Hoạt động", href: "/farm-activities" },
        { name: "Quy trình chung", href: "/activity-templates" },
      ],
    },
    {
      id: 3,
      name: "Vật tư nông nghiệp",
      subLinks: [
        { name: "Danh sách vật tư", href: "/farmer/listings" },
        { name: "Đơn hàng của tôi", href: "/farmer/orders" },
      ],
    },
    {
      id: 4,
      name: "Đăng tải",
      subLinks: [
        { name: "New Product", href: "/products/create" },
        { name: "Products", href: "/products" },
        { name: "Orders", href: "/orders" },
      ],
    },
    {
      id: 5,
      name: "Đổi công",
      subLinks: [
        { name: "Tổng quan", href: "/labor" },
        { name: "Yêu cầu đổi công", href: "/labor/requests" },
        { name: "Tạo yêu cầu đổi công", href: "/labor/requests/create" },
        { name: "Yêu cầu công khai", href: "/labor/public-requests" },
        { name: "Đổi công với hộ khác", href: "/labor/exchanges" },
        { name: "Phân công lao động", href: "/labor/assignments" },
        { name: "Phân công nông trại", href: "/labor/farm-assignments" },
        { name: "Thống kê đổi công", href: "/labor/assignment-stats" },
      ],
    },
    {
      id: 6,
      name: "Liên hệ",
      subLinks: [
        { name: "Liên hệ", href: "/contact" },
        { name: "Địa điểm", href: "/location" },
      ],
    },
  ],
  supplier: [
    {
      id: 1,
      name: "Bảng điều khiển",
      subLinks: [
        { name: "Overview", href: "/supplier/dashboard" },
      ],
    },
    {
      id: 2,
      name: "Quản lý vật tư",
      subLinks: [
        { name: "Danh sách vật tư", href: "/supplier/listings" },
        { name: "Tạo vật tư mới", href: "/supplier/listings/create" },
      ],
    },
    {
      id: 3,
      name: "Đơn hàng",
      subLinks: [
        { name: "Đơn hàng nhận được", href: "/supplier/orders" },
      ],
    },
    {
      id: 4,
      name: "Liên hệ",
      subLinks: [
        { name: "Liên hệ", href: "/contact" },
        { name: "Địa điểm", href: "/location" },
      ],
    },
  ],
  trader: [
    {
      id: 1,
      name: "Home",
      subLinks: [
        { name: "Homepage", href: "/calendar" },
        { name: "Chat", href: "/chat" },
        { name: "Field", href: "/fields" },
      ],
    },
    {
      id: 2,
      name: "Activity",
      subLinks: [{ name: "Farm Activities", href: "/farm-activities" }],
    },
    {
      id: 3,
      name: "Shop",
      subLinks: [
        { name: "New Product", href: "/products/create" },
        { name: "Products", href: "/products" },
        { name: "Categories", href: "/categories" },
      ],
    },
    {
      id: 4,
      name: "Contact Us",
      subLinks: [
        { name: "Contact", href: "/contact" },
        { name: "Location", href: "/location" },
      ],
    },
  ],
};

// Define the SubLink type if not already imported
interface SubLink {
  name: string;
  href: string;
}

interface NavlinksProps {
  userType: string | null;
}

export default function Navlinks({ userType }: NavlinksProps) {
  const navigate = useNavigate();
  const links = navlinksConfig[userType || "farmer"]; // Mặc định là "farmer" nếu không có userType

  return (
    <div className="flex bg-[#333333] text-white space-x-4 px-4 py-2 justify-between">
      <div className="flex">
        {links.map((link) => (
          <NavigationMenu key={link.id}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-gray-400 hover:text-white hover:bg-[#333333] bg-[#333333] text-[13px] active:bg-[#333333]">
                  {link.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-[#333333] text-white">
                  <div className="grid w-[200px] p-2">
                    {link.subLinks.map((subLink: SubLink) => (
                      <NavigationMenuLink
                        asChild
                        key={subLink.name}
                        className="px-4 cursor-pointer"
                      >
                        <p
                          onClick={() => navigate(subLink.href)}
                          className="block py-2 hover:bg-gray-700 rounded"
                        >
                          {subLink.name}
                        </p>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        ))}
      </div>
    </div>
  );
}
