import React, { useState, useEffect } from 'react';
import { Modal, Rate } from 'antd';
import { UserIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { verifyUser } from '@/services/marketplace/userService';

interface UserVerificationProps {
  userId: number;
  visible: boolean;
  onClose: () => void;
  onVerified?: () => void; // Thêm callback khi người dùng đã xác minh
}

const UserVerification: React.FC<UserVerificationProps> = ({ 
  userId, 
  visible, 
  onClose, 
  onVerified 
}) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (visible && userId) {
      fetchUserData();
    }
  }, [visible, userId]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await verifyUser(userId);
      setUserData(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching user verification data:', err);
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'farmer': return 'Hộ sản xuất';
      case 'trader': return 'Thương lái';
      case 'supplier': return 'Nhà cung cấp vật tư';
      default: return role;
    }
  };
  
  // Xử lý khi người dùng xác nhận đã xác minh
  const handleVerified = () => {
    // Gọi callback nếu được cung cấp
    if (onVerified) {
      onVerified();
    } else {
      // Nếu không có callback, chỉ đóng modal
      onClose();
    }
  };
  
  return (
    <Modal
      title="Xác minh thông tin đối tác"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loader"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : userData ? (
        <div>
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <UserIcon className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium">{userData.user.fullname}</h3>
            <div className="text-sm text-gray-500">{getRoleLabel(userData.user.role)}</div>
            
            <div className="mt-2 flex items-center">
              <Rate disabled value={userData.reputation.score} />
              <span className="ml-2 text-gray-700">
                {userData.reputation.score}/5
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Số điện thoại</div>
                <div>{userData.user.phone || 'Chưa cung cấp'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Tham gia từ</div>
                <div>{userData.user.joined_date}</div>
              </div>
              {userData.user.address && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500">Địa chỉ</div>
                  <div>{userData.user.address}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Thông tin giao dịch</h4>
            <div className="grid grid-cols-3 gap-2">
              {userData.user.role === 'trader' ? (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-medium">{userData.transaction_stats.total_purchases || 0}</div>
                    <div className="text-xs text-gray-500">Tổng đơn mua</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-medium">{userData.transaction_stats.completed_purchases || 0}</div>
                    <div className="text-xs text-gray-500">Hoàn thành</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-medium">{userData.transaction_stats.total_listings || 0}</div>
                    <div className="text-xs text-gray-500">Sản phẩm đã đăng</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-medium">{userData.transaction_stats.sold_listings || 0}</div>
                    <div className="text-xs text-gray-500">Đã bán</div>
                  </div>
                </>
              )}
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-lg font-medium">{userData.reputation.criteria.completed_transaction_rate}%</div>
                <div className="text-xs text-gray-500">Tỷ lệ thành công</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-4">
            <button 
              onClick={handleVerified} // Thay đổi từ onClose sang handleVerified
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Đã xác minh
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">Không tìm thấy thông tin người dùng</div>
      )}
    </Modal>
  );
};

export default UserVerification;