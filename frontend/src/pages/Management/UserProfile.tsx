import { useState, useEffect } from 'react';
import { getCurrentHousehold, getHouseholdWorkers, addWorkerToHousehold, removeWorker, updateWorkerStatus } from '@/services/labor/householdService';
import { getWorkerProfile, updateWorkerProfile } from '@/services/labor/workerProfileService';
import { getUserProfile } from '@/services/users/authService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import StatusBadge from '@/components/common/StatusBadge';

interface User {
  user_id: number;
  email: string;
  user_name: string;
  fullname: string;
  phone?: string;
  address?: string;
  user_type: string;
}

interface WorkerProfile {
  id: number;
  user_id: number;
  skills: string[];
  availability: string;
  daily_rate?: number;
  hourly_rate?: number;
}

interface HouseholdWorker {
  id: number;
  worker_id: number;
  name: string;
  relationship: string;
  joined_date: string;
  is_active: boolean;
  skills: string[];
}

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [workers, setWorkers] = useState<HouseholdWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [workerFormData, setWorkerFormData] = useState<Partial<WorkerProfile>>({});
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({
    worker_id: '',
    relationship: '',
    notes: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin user từ getUserProfile API
      const userData = await getUserProfile() as User;
      setUser(userData);
      setFormData(userData);

      // Nếu là worker, lấy worker profile
      if (userData.user_type === 'worker') {
        const profileRes = await getWorkerProfile();
        setWorkerProfile((profileRes as any).data);
        setWorkerFormData((profileRes as any).data);
      }

      // Nếu là owner, lấy thông tin household và workers
      if (userData.user_type === 'farmer') {
        const [householdRes, workersRes] = await Promise.all([
          getCurrentHousehold(),
          getHouseholdWorkers()
        ]);
        setHousehold((householdRes as any).data);
        setWorkers((workersRes as any).data || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      // Cập nhật thông tin user (cần implement API)
      // await updateUserProfile(user.user_id, formData);
      setUser({ ...user, ...formData });
      setEditing(false);
      toast.success('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin');
    }
  };

  const handleSaveWorkerProfile = async () => {
    if (!workerProfile) return;
    
    try {
      await updateWorkerProfile(workerProfile.id, workerFormData);
      setWorkerProfile({ ...workerProfile, ...workerFormData });
      setEditing(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (error) {
      console.error('Error updating worker profile:', error);
      toast.error('Không thể cập nhật hồ sơ');
    }
  };

  const handleAddWorker = async () => {
    if (!household || !newWorker.worker_id) return;
    
    try {
      await addWorkerToHousehold(household.id, {
        worker_id: parseInt(newWorker.worker_id),
        relationship: newWorker.relationship,
        notes: newWorker.notes
      });
      
      setNewWorker({ worker_id: '', relationship: '', notes: '' });
      setShowAddWorker(false);
      fetchUserData(); // Refresh data
      toast.success('Thêm nhân công thành công!');
    } catch (error) {
      console.error('Error adding worker:', error);
      toast.error('Không thể thêm nhân công');
    }
  };

  const handleRemoveWorker = async (workerId: number) => {
    if (!confirm('Bạn có chắc muốn xóa nhân công này?')) return;
    
    try {
      await removeWorker(workerId);
      fetchUserData(); // Refresh data
      toast.success('Xóa nhân công thành công!');
    } catch (error) {
      console.error('Error removing worker:', error);
      toast.error('Không thể xóa nhân công');
    }
  };

  const handleToggleWorkerStatus = async (workerId: number, isActive: boolean) => {
    try {
      await updateWorkerStatus(workerId, !isActive);
      fetchUserData(); // Refresh data
      toast.success('Cập nhật trạng thái thành công!');
    } catch (error) {
      console.error('Error updating worker status:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Không tìm thấy thông tin người dùng</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user.user_type === 'farmer';
  const isWorker = user.user_type === 'worker';

  return (
    <div>
      <div className="container mx-auto p-4">
        {/* Breadcrumb */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                Trang chủ
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Quản lý thông tin</span>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Thông tin người dùng</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Thông tin người dùng</h1>
          {!editing && (
            <Button 
              buttonType="primary"
              onClick={() => setEditing(true)}
            >
              Chỉnh sửa
            </Button>
          )}
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                 ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12]'}`
              }
            >
              Thông tin cá nhân
            </Tab>
            {isWorker && (
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                   ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12]'}`
                }
              >
                Hồ sơ lao động
              </Tab>
            )}
            {isOwner && (
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                   ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12]'}`
                }
              >
                Nhân công lao động
              </Tab>
            )}
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              <Card>
                <div className="p-6">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Họ và tên *
                        </label>
                        <input
                          type="text"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={formData.fullname || ''}
                          onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên đăng nhập
                        </label>
                        <input
                          type="text"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                          value={formData.user_name || ''}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                          value={formData.email || ''}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Địa chỉ
                        </label>
                        <textarea
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          buttonType="success"
                          onClick={handleSaveProfile}
                        >
                          Lưu thay đổi
                        </Button>
                        <Button 
                          buttonType="secondary"
                          onClick={() => {
                            setFormData(user);
                            setEditing(false);
                          }}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.fullname}</h3>
                        <p className="text-sm text-gray-500">@{user.user_name}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-medium">{user.phone || 'Chưa cập nhật'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Địa chỉ</p>
                          <p className="font-medium">{user.address || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Tab.Panel>
            
            {isWorker && (
              <Tab.Panel>
                <Card>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Hồ sơ lao động</h3>
                      {!editing && (
                        <Button 
                          buttonType="primary"
                          onClick={() => setEditing(true)}
                        >
                          Chỉnh sửa
                        </Button>
                      )}
                    </div>
                    
                    {editing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kỹ năng
                          </label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={Array.isArray(workerFormData.skills) ? workerFormData.skills.join(', ') : ''}
                            onChange={(e) => setWorkerFormData({ 
                              ...workerFormData, 
                              skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                            })}
                            placeholder="Nhập kỹ năng, phân cách bằng dấu phẩy"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                          </label>
                          <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={workerFormData.availability || ''}
                            onChange={(e) => setWorkerFormData({ ...workerFormData, availability: e.target.value })}
                          >
                            <option value="available">Có sẵn</option>
                            <option value="busy">Bận</option>
                            <option value="unavailable">Không có sẵn</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Giá theo ngày (VNĐ)
                            </label>
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={workerFormData.daily_rate || ''}
                              onChange={(e) => setWorkerFormData({ ...workerFormData, daily_rate: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Giá theo giờ (VNĐ)
                            </label>
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={workerFormData.hourly_rate || ''}
                              onChange={(e) => setWorkerFormData({ ...workerFormData, hourly_rate: parseInt(e.target.value) || undefined })}
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 pt-4">
                          <Button 
                            buttonType="success"
                            onClick={handleSaveWorkerProfile}
                          >
                            Lưu thay đổi
                          </Button>
                          <Button 
                            buttonType="secondary"
                            onClick={() => {
                              setWorkerFormData(workerProfile || {});
                              setEditing(false);
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workerProfile && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Kỹ năng</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {Array.isArray(workerProfile.skills) && workerProfile.skills.length > 0 ? (
                                  workerProfile.skills.map((skill, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  <p className="text-gray-500">Chưa cập nhật</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Trạng thái</p>
                                <StatusBadge status={workerProfile.availability} />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Giá theo ngày</p>
                                <p className="font-medium">
                                  {workerProfile.daily_rate ? `${workerProfile.daily_rate.toLocaleString()} VNĐ` : 'Chưa cập nhật'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Giá theo giờ</p>
                                <p className="font-medium">
                                  {workerProfile.hourly_rate ? `${workerProfile.hourly_rate.toLocaleString()} VNĐ` : 'Chưa cập nhật'}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Tab.Panel>
            )}
            
            {isOwner && (
              <Tab.Panel>
                <Card>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Nhân công lao động</h3>
                      <Button 
                        buttonType="primary"
                        onClick={() => setShowAddWorker(true)}
                      >
                        Thêm nhân công
                      </Button>
                    </div>
                    
                    {showAddWorker && (
                      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-3">Thêm nhân công mới</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ID người dùng *
                            </label>
                            <input
                              type="number"
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newWorker.worker_id}
                              onChange={(e) => setNewWorker({ ...newWorker, worker_id: e.target.value })}
                              placeholder="Nhập ID người dùng"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quan hệ
                            </label>
                            <input
                              type="text"
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={newWorker.relationship}
                              onChange={(e) => setNewWorker({ ...newWorker, relationship: e.target.value })}
                              placeholder="Ví dụ: Anh em, Hàng xóm, ..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ghi chú
                            </label>
                            <textarea
                              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              rows={2}
                              value={newWorker.notes}
                              onChange={(e) => setNewWorker({ ...newWorker, notes: e.target.value })}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              buttonType="success"
                              onClick={handleAddWorker}
                            >
                              Thêm
                            </Button>
                            <Button 
                              buttonType="secondary"
                              onClick={() => setShowAddWorker(false)}
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {workers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Chưa có nhân công nào
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workers.map((worker) => (
                          <div key={worker.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {worker.name}
                                </h4>
                                <p className="text-sm text-gray-500">Quan hệ: {worker.relationship}</p>
                                {worker.skills && worker.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {worker.skills.map((skill, index) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm text-gray-500">
                                  Tham gia từ: {new Date(worker.joined_date).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={worker.is_active ? 'active' : 'inactive'} />
                                <Button 
                                  buttonType={worker.is_active ? 'danger' : 'success'}
                                  onClick={() => handleToggleWorkerStatus(worker.id, worker.is_active)}
                                >
                                  {worker.is_active ? 'Tạm ngưng' : 'Kích hoạt'}
                                </Button>
                                <Button 
                                  buttonType="danger"
                                  onClick={() => handleRemoveWorker(worker.id)}
                                >
                                  Xóa
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Tab.Panel>
            )}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default UserProfile; 