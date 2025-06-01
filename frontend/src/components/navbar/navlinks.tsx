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
        { name: "Đổi công", href: "/labor" },
        { name: "Quy trình chung", href: "/activity-templates" },
      ],
      
    },
    {
      id: 3,
      name: "Đăng tải",
      subLinks: [
        { name: "New Product", href: "/products/create" },
        { name: "Products", href: "/products" },
        { name: "Orders", href: "/orders" },
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
  supplier: [
    {
      id: 1,
      name: "Dashboard",
      subLinks: [
        { name: "Overview", href: "/supplier/dashboard" },
        { name: "Listings", href: "/supplier/listings-management" },
        { name: "Orders", href: "/supplier/orders" },
      ],
    },
    {
      id: 2,
      name: "Contact Us",
      subLinks: [
        { name: "Contact", href: "/contact" },
        { name: "Location", href: "/location" },
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
