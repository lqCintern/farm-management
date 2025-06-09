import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar";
import SideNavigation from "@/components/sidebar";
import { getUserProfile } from "@/services/users/authService";
import Footer from "@/features/footer";

export default function MainLayout() {
    const [userType, setUserType] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        async function fetchUserType() {
            try {
                const userProfile = await getUserProfile();
                setUserType((userProfile as any)?.user_type || "farmer");
            } catch (error) {
                console.error("Error fetching user type:", error);
            }
        }

        fetchUserType();
    }, []);

    // Hàm callback để nhận trạng thái sidebar từ SideNavigation
    const handleSidebarToggle = (collapsed: boolean) => {
        setSidebarCollapsed(collapsed);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar - fixed position */}
            <div className={`fixed inset-y-0 left-0 z-20 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                <SideNavigation 
                    userType={userType} 
                    onToggle={handleSidebarToggle}
                />
            </div>

            {/* Main content area - takes remaining space */}
            <div className={`flex flex-col w-full transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
                {/* Navbar */}
                <div className="sticky top-0 z-10 bg-white shadow-sm">
                    <Navbar />
                </div>

                {/* Main content */}
                <div className="flex flex-col flex-1">
                    <main className="flex-grow p-6">
                        <Outlet />
                    </main>

                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </div>
    );
}
