export const navlinksConfig: Record<string, any[]> = {
  farmer: [
    {
      id: 1,
      name: "Home",
      subLinks: [
        { name: "Homepage", href: "/calendar" },
        { name: "Chat", href: "/chat" },
        { name: "Field", href: "/fields" },
        { name: "Tasks", href: "/tasks" },
        { name: "Notes", href: "/notes" },
      ],
    },
    {
      id: 2,
      name: "Activity",
      subLinks: [{ name: "Farm Activities", href: "/farm-activities" }],
    },
    {
      id: 3,
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
      name: "Shop",
      subLinks: [
        { name: "New Product", href: "/products/create" },
        { name: "Products", href: "/products" },
        { name: "Categories", href: "/categories" },
      ],
    },
    {
      id: 3,
      name: "Contact Us",
      subLinks: [
        { name: "Contact", href: "/contact" },
        { name: "Location", href: "/location" },
      ],
    },
  ],
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};
