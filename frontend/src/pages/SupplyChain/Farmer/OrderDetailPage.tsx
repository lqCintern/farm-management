import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Card, Descriptions, Divider, Image, Modal, Spin, Typography, Tag, Space, Result } from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import supplyOrderService from '../../../services/supply_chain/supplyOrderService';

const { Title, Text } = Typography;
const { confirm } = Modal;

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await supplyOrderService.getFarmerOrderById(Number(id));
        if (response.status === "success") {
          setOrder(response.data);
          setError(null);
        } else {
          setError(response.message || 'Không thể tải thông tin đơn hàng');
        }
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin đơn hàng');
        console.error('Error fetching order details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const handleCancelOrder = () => {
    confirm({
      title: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Khi hủy, đơn hàng này sẽ không thể khôi phục.',
      onOk: async () => {
        try {
          await supplyOrderService.cancelOrder(Number(id));
          // Refresh order data after cancellation
          const response = await supplyOrderService.getFarmerOrderById(Number(id));
          if (response.status === "success") {
            setOrder(response.data);
          }
        } catch (err: any) {
          Modal.error({
            title: 'Không thể hủy đơn hàng',
            content: err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
          });
        }
      },
    });
  };

  const handleCompleteOrder = () => {
    console.log('handleCompleteOrder called');
    setConfirmModalVisible(true);
  };

  const handleConfirmComplete = async () => {
    try {
      setCompleteLoading(true);
      console.log('Đang gửi API request...');
      const completeResponse = await supplyOrderService.completeOrder(Number(id));
      console.log('Kết quả API:', completeResponse);
      
      // Refresh order data after completion
      const response = await supplyOrderService.getFarmerOrderById(Number(id));
      if (response.status === "success") {
        setOrder(response.data);
        setConfirmModalVisible(false);
        alert('Đơn hàng đã được đánh dấu là hoàn thành');
      }
    } catch (err: any) {
      console.error('Lỗi khi hoàn thành đơn hàng:', err);
      alert(`Không thể hoàn thành đơn hàng: ${err.message || 'Đã có lỗi xảy ra'}`);
    } finally {
      setCompleteLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'pending': { color: 'gold', text: 'Chờ xác nhận' },
      'confirmed': { color: 'blue', text: 'Đã xác nhận' },
      'processing': { color: 'processing', text: 'Đang xử lý' },
      'shipped': { color: 'cyan', text: 'Đang giao hàng' },
      'delivered': { color: 'geekblue', text: 'Đã giao hàng' },
      'completed': { color: 'green', text: 'Hoàn thành' },
      'cancelled': { color: 'red', text: 'Đã hủy' },
      'rejected': { color: 'volcano', text: 'Bị từ chối' },
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('vi-VN') + ' VNĐ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải thông tin đơn hàng..." />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Không thể tải thông tin đơn hàng"
        subTitle={error}
        extra={[
          <Button type="primary" key="back" onClick={() => navigate('/farmer/orders')}>
            Quay lại đơn hàng của tôi
          </Button>
        ]}
      />
    );
  }

  if (!order) {
    return (
      <Result
        status="404"
        title="Không tìm thấy đơn hàng"
        subTitle="Đơn hàng không tồn tại hoặc đã bị xóa."
        extra={[
          <Button type="primary" key="back" onClick={() => navigate('/farmer/orders')}>
            Quay lại đơn hàng của tôi
          </Button>
        ]}
      />
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const canComplete = ['delivered'].includes(order.status);
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract coordinates from delivery_address if available
  const getCoordinates = () => {
    if (!order.delivery_address) return null;
    const match = order.delivery_address.match(/\[Lat: ([\d.]+), Lng: ([\d.]+)\]/);
    return match ? { lat: match[1], lng: match[2] } : null;
  };

  const coordinates = getCoordinates();
  const googleMapsUrl = coordinates 
    ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
    : null;

  const getCleanAddress = () => {
    if (!order.delivery_address) return '';
    return order.delivery_address.replace(/\[Lat: [\d.]+, Lng: [\d.]+\]/, '').trim();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/farmer/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <Title level={4} className="mb-0">Chi tiết đơn hàng #{order.id}</Title>
          {getStatusTag(order.status)}
        </div>
        
        <Divider />

        <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
          <Descriptions.Item label="Mã đơn hàng">{order.id}</Descriptions.Item>
          <Descriptions.Item label="Ngày đặt hàng">{formatDate(order.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Nhà cung cấp">{order.supplier?.name || 'Không xác định'}</Descriptions.Item>
          <Descriptions.Item label="Liên hệ nhà cung cấp">{order.supplier?.phone || 'Không có thông tin'}</Descriptions.Item>
          {order.rejection_reason && (
            <Descriptions.Item label="Lý do từ chối" span={2}>
              <Text type="danger">{order.rejection_reason}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Title level={5} className="mt-8 mb-4">Thông tin vật tư</Title>
        <Card className="mb-4">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/4 mb-4 md:mb-0 md:mr-4">
              {order.supply_listing?.image ? (
                <Image
                  src={order.supply_listing.image}
                  alt={order.supply_listing.name}
                  style={{ maxHeight: '150px', objectFit: 'contain' }}
                />
              ) : (
                <div className="bg-gray-200 h-32 flex items-center justify-center">
                  <Text type="secondary">Không có hình ảnh</Text>
                </div>
              )}
            </div>
            <div className="w-full md:w-3/4">
              <Title level={5}>{order.supply_listing?.name}</Title>
              <Descriptions column={1}>
                <Descriptions.Item label="Danh mục">{order.supply_listing?.category}</Descriptions.Item>
                <Descriptions.Item label="Nhà sản xuất">
                  {order.supply_listing?.manufacturer || order.supply_listing?.brand || 'Không có thông tin'}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng">
                  {order.quantity} {order.supply_listing?.unit}
                </Descriptions.Item>
                <Descriptions.Item label="Đơn giá">{formatCurrency(order.price)}</Descriptions.Item>
                <Descriptions.Item label="Thành tiền">
                  <Text strong type="danger">
                    {formatCurrency(order.total)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Card>

        <Title level={5} className="mt-8 mb-4">Thông tin giao hàng</Title>
        <Descriptions bordered>
          <Descriptions.Item label="Địa chỉ giao hàng" span={3}>
            <Space direction="vertical">
              <div>
                {getCleanAddress()}
                {order.delivery_ward && `, ${order.delivery_ward}`}
                {order.delivery_district && `, ${order.delivery_district}`}
                {order.delivery_province && `, ${order.delivery_province}`}
              </div>
              {googleMapsUrl && (
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                  Xem trên Google Maps
                </a>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại liên hệ">
            {order.contact_phone || 'Không có thông tin'}
          </Descriptions.Item>
          <Descriptions.Item label="Ghi chú" span={2}>
            {order.note || 'Không có ghi chú'}
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-8 flex justify-end space-x-4">
          {canCancel && (
            <Button danger onClick={handleCancelOrder}>
              Hủy đơn hàng
            </Button>
          )}
          {canComplete && (
            <Button type="primary" onClick={handleCompleteOrder}>
              Xác nhận đã nhận hàng
            </Button>
          )}
          <Link to={`/farmer/listings/${order.supply_listing?.id}`}>
            <Button>Xem vật tư</Button>
          </Link>
        </div>
      </div>

      {/* Thêm Modal hiển thị rõ ràng */}
      <Modal
        title="Xác nhận đã nhận hàng"
        open={confirmModalVisible}
        onOk={handleConfirmComplete}
        confirmLoading={completeLoading}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p>Xác nhận bạn đã nhận được hàng và đồng ý hoàn thành đơn hàng?</p>
      </Modal>
    </div>
  );
};

export default OrderDetailPage;
