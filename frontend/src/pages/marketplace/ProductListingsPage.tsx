import { useEffect, useState } from 'react';
import { getUserProfile } from '@/services/users/authService';
import TraderProductListingList from '@/components/ProductListing/TraderProductListingList';
import FarmerProductListingList from '@/components/ProductListing/FarmerProductListingList';
import Breadcrumb from '@/components/common/Breadcrumb';

export default function ProductListingsPage() {
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Cửa hàng" },
    { label: "Danh sách sản phẩm" }
  ];

  useEffect(() => {
    async function fetchUserType() {
      try {
        const profile = await getUserProfile();
        setUserType((profile as { user_type: string }).user_type);
      } catch (error) {
        console.error("Error fetching user type:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserType();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb items={breadcrumbItems} />
      
      {userType === 'trader' ? (
        <TraderProductListingList />
      ) : userType === 'farmer' ? (
        <FarmerProductListingList />
      ) : (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          Không thể xác định loại người dùng. Vui lòng đăng nhập lại.
        </div>
      )}
    </div>
  );
}
