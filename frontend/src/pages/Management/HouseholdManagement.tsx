import { useState, useEffect } from 'react';
import { getCurrentHousehold, updateHousehold } from '@/services/labor/householdService';
import { getHouseholdExchanges } from '@/services/labor/exchangeService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';

interface Household {
  id: number;
  name: string;
  description?: string;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  owner_id: number;
}

interface Exchange {
  id: number;
  partner_household_id: number;
  partner_household_name: string;
  balance: number;
  total_transactions: number;
  last_transaction_date?: string;
}

const HouseholdManagement = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Household>>({});

  useEffect(() => {
    fetchHouseholdData();
  }, []);

  const fetchHouseholdData = async () => {
    try {
      setLoading(true);
      const [householdRes, exchangesRes] = await Promise.all([
        getCurrentHousehold(),
        getHouseholdExchanges()
      ]);
      
      setHousehold((householdRes as any).data);
      setFormData((householdRes as any).data);
      setExchanges((exchangesRes as any).data || []);
    } catch (error) {
      console.error('Error fetching household data:', error);
      toast.error('Không thể tải thông tin hộ sản xuất');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!household) return;
    
    try {
      const { id, owner_id, ...updateData } = formData;
      await updateHousehold(household.id, updateData);
      setHousehold({ ...household, ...updateData });
      setEditing(false);
      toast.success('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating household:', error);
      toast.error('Không thể cập nhật thông tin');
    }
  };

  const handleCancel = () => {
    setFormData(household || {});
    setEditing(false);
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

  if (!household) {
    return (
      <div>
        <div className="container mx-auto p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Không tìm thấy thông tin hộ sản xuất</p>
          </div>
        </div>
      </div>
    );
  }

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
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Thông tin hộ sản xuất</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý hộ sản xuất</h1>
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
              Thông tin cơ bản
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                 ${selected ? 'bg-white shadow text-blue-700' : 'text-gray-700 hover:bg-white/[0.12]'}`
              }
            >
              Mối liên hệ đổi công
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              <Card>
                <div className="p-6">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên hộ sản xuất *
                        </label>
                        <input
                          type="text"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả
                        </label>
                        <textarea
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tỉnh/Thành phố
                          </label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.province || ''}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quận/Huyện
                          </label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.district || ''}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phường/Xã
                          </label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.ward || ''}
                            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ chi tiết
                          </label>
                          <input
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-4">
                        <Button 
                          buttonType="success"
                          onClick={handleSave}
                        >
                          Lưu thay đổi
                        </Button>
                        <Button 
                          buttonType="secondary"
                          onClick={handleCancel}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{household.name}</h3>
                        {household.description && (
                          <p className="text-gray-600 mt-1">{household.description}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Tỉnh/Thành phố</p>
                          <p className="font-medium">{household.province || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quận/Huyện</p>
                          <p className="font-medium">{household.district || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phường/Xã</p>
                          <p className="font-medium">{household.ward || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Địa chỉ chi tiết</p>
                          <p className="font-medium">{household.address || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Tab.Panel>
            
            <Tab.Panel>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Mối liên hệ đổi công</h3>
                  
                  {exchanges.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có mối liên hệ đổi công nào
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {exchanges.map((exchange) => (
                        <div key={exchange.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {exchange.partner_household_name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {exchange.total_transactions} giao dịch
                              </p>
                              {exchange.last_transaction_date && (
                                <p className="text-sm text-gray-500">
                                  Giao dịch cuối: {new Date(exchange.last_transaction_date).toLocaleDateString('vi-VN')}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${exchange.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {exchange.balance >= 0 ? '+' : ''}{exchange.balance} giờ
                              </p>
                              <p className="text-sm text-gray-500">
                                {exchange.balance >= 0 ? 'Được nợ' : 'Nợ'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default HouseholdManagement; 