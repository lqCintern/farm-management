import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaEdit, FaTrash, FaTint, FaSeedling, FaLeaf, FaBug, FaHandHoldingWater, FaChartBar } from 'react-icons/fa';
import { getFarmActivities } from '@/services/farming/farmService';
import { FarmActivity } from '@/types/labor/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import FarmActivityStats from '@/components/FarmActivity/FarmActivityStats';
import FarmActivityModal from '@/components/FarmActivity/FarmActivityModal';
import Breadcrumb from '@/components/common/Breadcrumb';

const FarmActivityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await getFarmActivities();
        // Sort activities by start_date (earliest first - closest to current date)
        const sortedActivities = response.farm_activities.sort((a: FarmActivity, b: FarmActivity) => {
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });
        setActivities(sortedActivities);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError('Không thể tải danh sách hoạt động');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Get activity type icon and label
  const getActivityTypeInfo = (type: string) => {
    const typeMap: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      'watering': { 
        icon: <FaTint className="w-5 h-5" />, 
        label: 'Tưới nước', 
        color: 'text-blue-600 bg-blue-50' 
      },
      'fertilizing': { 
        icon: <FaSeedling className="w-5 h-5" />, 
        label: 'Bón phân', 
        color: 'text-green-600 bg-green-50' 
      },
      'harvesting': { 
        icon: <FaHandHoldingWater className="w-5 h-5" />, 
        label: 'Thu hoạch', 
        color: 'text-orange-600 bg-orange-50' 
      },
      'pesticide': { 
        icon: <FaBug className="w-5 h-5" />, 
        label: 'Phun thuốc', 
        color: 'text-purple-600 bg-purple-50' 
      },
      'soil_preparation': { 
        icon: <FaSeedling className="w-5 h-5" />, 
        label: 'Làm đất', 
        color: 'text-brown-600 bg-brown-50' 
      },
      'planting': { 
        icon: <FaSeedling className="w-5 h-5" />, 
        label: 'Gieo trồng', 
        color: 'text-emerald-600 bg-emerald-50' 
      },
      'leaf_tying': { 
        icon: <FaLeaf className="w-5 h-5" />, 
        label: 'Buộc lá', 
        color: 'text-teal-600 bg-teal-50' 
      },
      'fruit_development': { 
        icon: <FaSeedling className="w-5 h-5" />, 
        label: 'Phát triển quả', 
        color: 'text-pink-600 bg-pink-50' 
      }
    };

    return typeMap[type] || { 
      icon: <FaSeedling className="w-5 h-5" />, 
      label: type, 
      color: 'text-gray-600 bg-gray-50' 
    };
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      'pending': { 
        label: 'Chờ thực hiện', 
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
        icon: <FaClock className="w-4 h-4" />
      },
      'completed': { 
        label: 'Đã hoàn thành', 
        color: 'text-green-600 bg-green-50 border-green-200', 
        icon: <FaCheckCircle className="w-4 h-4" />
      },
      'cancelled': { 
        label: 'Đã hủy', 
        color: 'text-red-600 bg-red-50 border-red-200', 
        icon: <FaExclamationTriangle className="w-4 h-4" />
      }
    };

    return statusMap[status] || { 
      label: status, 
      color: 'text-gray-600 bg-gray-50 border-gray-200', 
      icon: <FaClock className="w-4 h-4" />
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get days remaining
  const getDaysRemaining = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Đã quá hạn', color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Hôm nay', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Ngày mai', color: 'text-yellow-600' };
    } else if (diffDays <= 3) {
      return { text: `Còn ${diffDays} ngày`, color: 'text-yellow-600' };
    } else {
      return { text: `Còn ${diffDays} ngày`, color: 'text-gray-600' };
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || activity.status === selectedStatus;
    const activityTypeStr = activity.activity_type ? String(activity.activity_type) : '';
    const matchesType = !selectedType || activityTypeStr === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination logic
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of the list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedType]);

  // Handle add activity
  const handleAddActivity = (newActivity: any) => {
    setActivities((prev) => [...prev, newActivity]);
    setIsModalOpen(false);
  };

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Hoạt động" },
    { label: "Hoạt động nông trại" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Đang tải danh sách hoạt động...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Hoạt động Nông trại
              </h1>
              <p className="text-gray-600">
                Quản lý và theo dõi các hoạt động nông nghiệp của bạn
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                buttonType="secondary"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaPlus className="w-5 h-5" />
                Thêm hoạt động
              </Button>
              <Button
                buttonType="primary"
                onClick={() => navigate('/farm-activities/create')}
                className="flex items-center gap-2 px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaPlus className="w-5 h-5" />
                Tạo hoạt động mới
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-lg shadow-sm">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-8 font-medium text-sm focus:outline-none transition-colors rounded-t-lg ${
              activeTab === 'list'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaSeedling className="w-4 h-4" />
              Danh sách hoạt động
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-8 font-medium text-sm focus:outline-none transition-colors rounded-t-lg ${
              activeTab === 'stats'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaChartBar className="w-4 h-4" />
              Thống kê
            </div>
          </button>
        </div>

        {activeTab === 'list' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div 
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedStatus === '' ? 'ring-4 ring-blue-300 rounded-lg' : ''
                }`}
                onClick={() => setSelectedStatus('')}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Tổng hoạt động</p>
                        <p className="text-3xl font-bold">{activities.length}</p>
                      </div>
                      <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
                        <FaSeedling className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div 
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedStatus === 'completed' ? 'ring-4 ring-green-300 rounded-lg' : ''
                }`}
                onClick={() => setSelectedStatus('completed')}
              >
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Đã hoàn thành</p>
                        <p className="text-3xl font-bold">
                          {activities.filter(a => a.status === 'completed').length}
                        </p>
                      </div>
                      <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
                        <FaCheckCircle className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div 
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedStatus === 'pending' ? 'ring-4 ring-yellow-300 rounded-lg' : ''
                }`}
                onClick={() => setSelectedStatus('pending')}
              >
                <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Đang chờ</p>
                        <p className="text-3xl font-bold">
                          {activities.filter(a => a.status === 'pending').length}
                        </p>
                      </div>
                      <div className="bg-yellow-400 bg-opacity-30 p-3 rounded-full">
                        <FaClock className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div 
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedStatus === 'cancelled' ? 'ring-4 ring-purple-300 rounded-lg' : ''
                }`}
                onClick={() => setSelectedStatus('cancelled')}
              >
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Đã hủy</p>
                        <p className="text-3xl font-bold">
                          {activities.filter(a => a.status === 'cancelled').length}
                        </p>
                      </div>
                      <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
                        <FaExclamationTriangle className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm hoạt động..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div className="lg:w-48">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Tất cả loại</option>
                      <option value="watering">Tưới nước</option>
                      <option value="fertilizing">Bón phân</option>
                      <option value="harvesting">Thu hoạch</option>
                      <option value="pesticide">Phun thuốc</option>
                      <option value="soil_preparation">Làm đất</option>
                      <option value="planting">Gieo trồng</option>
                      <option value="leaf_tying">Buộc lá</option>
                      <option value="fruit_development">Phát triển quả</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {(selectedStatus || selectedType || searchTerm) && (
                    <div className="lg:w-auto">
                      <button
                        onClick={() => {
                          setSelectedStatus('');
                          setSelectedType('');
                          setSearchTerm('');
                        }}
                        className="w-full lg:w-auto px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Filters Display */}
                {(selectedStatus || selectedType || searchTerm) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedStatus && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Trạng thái: {selectedStatus === 'completed' ? 'Đã hoàn thành' : selectedStatus === 'pending' ? 'Đang chờ' : 'Đã hủy'}
                        <button
                          onClick={() => setSelectedStatus('')}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedType && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Loại: {selectedType}
                        <button
                          onClick={() => setSelectedType('')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchTerm && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        Tìm kiếm: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Activities List */}
            {error ? (
              <Card>
                <div className="p-6 text-center">
                  <div className="text-red-500 text-lg mb-2">⚠️</div>
                  <p className="text-red-600">{error}</p>
                </div>
              </Card>
            ) : filteredActivities.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">🌱</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Không tìm thấy hoạt động nào
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || selectedStatus || selectedType 
                      ? 'Thử thay đổi bộ lọc để xem thêm kết quả'
                      : 'Bắt đầu tạo hoạt động nông nghiệp đầu tiên của bạn'
                    }
                  </p>
                  <Button
                    buttonType="primary"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <FaPlus className="w-4 h-4" />
                    Thêm hoạt động mới
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {currentActivities.map((activity) => {
                  const activityTypeStr = activity.activity_type ? String(activity.activity_type) : '';
                  const typeInfo = getActivityTypeInfo(activityTypeStr);
                  const statusInfo = getStatusInfo(activity.status || '');
                  const daysRemaining = getDaysRemaining(activity.start_date);

                  return (
                    <div 
                      key={activity.id} 
                      className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                      onClick={() => navigate(`/farm-activities/${activity.id}`)}
                    >
                      <Card>
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                              {typeInfo.icon}
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                            {activity.description}
                          </h3>

                          {/* Type */}
                          <p className="text-sm text-gray-600 mb-4">
                            {typeInfo.label}
                          </p>

                          {/* Time Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                              <span>
                                {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                              </span>
                            </div>
                            {activity.status === 'pending' && (
                              <div className={`flex items-center gap-2 text-sm font-medium ${daysRemaining.color}`}>
                                <FaClock className="w-4 h-4" />
                                <span>{daysRemaining.text}</span>
                              </div>
                            )}
                          </div>

                          {/* Materials */}
                          {activity.requires_materials && activity.materials && activity.materials.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Vật tư cần thiết:</p>
                              <div className="flex flex-wrap gap-1">
                                {activity.materials.slice(0, 3).map((material: any, index: number) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                  >
                                    {material.name}
                                  </span>
                                ))}
                                {activity.materials.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{activity.materials.length - 3} khác
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>Ruộng #{activity.field_id}</span>
                              <span>•</span>
                              <span>Cây #{activity.crop_animal_id}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/farm-activities/${activity.id}`);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/farm-activities/${activity.id}/edit`);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="mt-8">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Hiển thị {startIndex + 1} - {Math.min(endIndex, totalItems)} trong {totalItems} kết quả
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          currentPage > 1
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Trước
                      </button>
                      
                      {/* Show page numbers with ellipsis for large numbers */}
                      {totalPages <= 7 ? (
                        // Show all pages if total is small
                        [...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              currentPage === i + 1
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))
                      ) : (
                        // Show pages with ellipsis for large numbers
                        <>
                          {/* First page */}
                          <button
                            onClick={() => handlePageChange(1)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              currentPage === 1
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            1
                          </button>
                          
                          {/* Ellipsis if needed */}
                          {currentPage > 4 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          
                          {/* Pages around current */}
                          {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            if (pageNum > 1 && pageNum < totalPages && 
                                pageNum >= currentPage - 1 && pageNum <= currentPage + 1) {
                              return (
                                <button
                                  key={i}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-4 py-2 rounded-lg border transition-colors ${
                                    currentPage === pageNum
                                      ? 'bg-green-600 border-green-600 text-white'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                            return null;
                          })}
                          
                          {/* Ellipsis if needed */}
                          {currentPage < totalPages - 3 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          
                          {/* Last page */}
                          {totalPages > 1 && (
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              className={`px-4 py-2 rounded-lg border transition-colors ${
                                currentPage === totalPages
                                  ? 'bg-green-600 border-green-600 text-white'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {totalPages}
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          currentPage < totalPages
                            ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <FarmActivityStats />
        )}
      </div>

      {/* Modal */}
      <FarmActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddActivity={handleAddActivity}
      />
    </div>
  );
};

export default FarmActivityListPage;
