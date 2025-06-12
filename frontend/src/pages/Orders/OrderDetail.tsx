import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Descriptions, Button, Divider, Tag, Steps, message, 
  Modal, Input, Space, Skeleton
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, 
  MessageOutlined, ArrowLeftOutlined, FileDoneOutlined, 
  ShoppingOutlined, ScheduleOutlined
} from '@ant-design/icons';
import {
  getProductOrderById,
  updateProductOrderStatus,
} from '@/services/marketplace/productOrderService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import ScheduleHarvestModal from '@/components/Conversation/ScheduleHarvestModal';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { confirm } = Modal;
const { TextArea } = Input;

/**
 * Đơn giản hóa việc lấy thông tin người dùng từ localStorage
 */
const getUserInfo = () => {
  try {
    // Thử lấy từ userInfo trước
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      return JSON.parse(userInfo);
    }
    
    // Thử lấy từ auth-storage nếu không tìm thấy trong userInfo
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed.state?.user) {
        return parsed.state.user;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  
  // Lấy thông tin người dùng từ localStorage
  const userInfo = getUserInfo();
  const currentUserId = userInfo?.user_id;
  
  // Thay đổi cách kiểm tra quyền để phù hợp với cấu trúc mới
  const isSellerOfOrder = currentUserId && order?.seller?.id === currentUserId;
  const isBuyerOfOrder = currentUserId && order?.buyer?.id === currentUserId;
  
  // Fetch data
  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);
  
  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await getProductOrderById(Number(id)) as { order: any };
      setOrder(response.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      message.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xử lý chấp nhận đơn hàng
   */
  const showAcceptModal = () => {
    console.log('Showing accept modal'); // Debug
    setAcceptModalVisible(true);
  };

  const confirmAccept = async () => {
    try {
      setActionLoading(true);
      console.log('Calling API to accept order', id); // Debug
      await updateProductOrderStatus(Number(id), 'accept');
      message.success('Đã chấp nhận đơn hàng thành công');
      await fetchOrderDetail();
      setAcceptModalVisible(false);
      setScheduleModalVisible(true);
    } catch (error) {
      console.error('Error accepting order:', error);
      message.error('Không thể chấp nhận đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Xử lý từ chối đơn hàng
   */
  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối đơn hàng');
      return;
    }
    
    try {
      setActionLoading(true);
      // Sửa cách gửi dữ liệu lên - chỉ gửi reason
      await updateProductOrderStatus(Number(id), 'reject', { reason: rejectReason });
      message.success('Đã từ chối đơn hàng');
      setRejectModalVisible(false);
      fetchOrderDetail();
    } catch (error) {
      console.error('Error rejecting order:', error);
      message.error('Không thể từ chối đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Xử lý hoàn thành đơn hàng
   */
  const handleCompleteOrder = () => {
    confirm({
      title: 'Xác nhận hoàn thành đơn hàng',
      icon: <FileDoneOutlined style={{ color: '#1890ff' }} />,
      content: 'Khi xác nhận hoàn thành, đơn hàng sẽ được đánh dấu là đã giao dịch xong và không thể thay đổi.',
      onOk: async () => {
        try {
          setActionLoading(true);
          await updateProductOrderStatus(Number(id), 'complete');
          message.success('Đã đánh dấu đơn hàng hoàn thành');
          fetchOrderDetail();
        } catch (error) {
          console.error('Error completing order:', error);
          message.error('Không thể hoàn thành đơn hàng');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  /**
   * Xử lý liên hệ với người mua/bán
   */
  const handleContact = () => {
    // Kiểm tra xem đối tác chat là ai
    const partnerId = isSellerOfOrder ? order.buyer.user_id : order.product_listing.user_id;
    navigate(`/chat?with=${partnerId}`);
  };

  /**
   * Hiển thị bước hiện tại của quy trình đơn hàng
   */
  const getOrderStatusStep = () => {
    switch (order?.status) {
      case 'pending': return 0;
      case 'accepted': return 1;  
      case 'completed': return 3;
      case 'rejected': return -1;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          Không tìm thấy thông tin đơn hàng
        </div>
        <Button 
          onClick={() => navigate('/orders')} 
          icon={<ArrowLeftOutlined />} 
          className="mt-4"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Nút trở lại */}
      <Button
        onClick={() => navigate('/orders')}
        icon={<ArrowLeftOutlined />}
        className="mb-4"
      >
        Quay lại danh sách
      </Button>

      <Card className="mb-6">
        {/* Tiêu đề và trạng thái */}
        <div className="flex justify-between items-center mb-4">
          <Title level={3}>
            Chi tiết đơn hàng #{order.id}
            <Tag 
              color={
                order.status === 'completed' ? 'green' :
                order.status === 'accepted' ? 'blue' :
                order.status === 'rejected' ? 'red' : 'orange'
              }
              className="ml-2"
            >
              {order.status === 'completed' ? 'Đã hoàn thành' :
               order.status === 'accepted' ? 'Đã chấp nhận' :
               order.status === 'rejected' ? 'Đã từ chối' : 'Chờ xác nhận'}
            </Tag>
          </Title>
          <Text type="secondary">
            Ngày tạo: {formatDate(order.created_at)}
          </Text>
        </div>

        {/* Quy trình đơn hàng */}
        {order.status !== 'rejected' && (
          <Steps current={getOrderStatusStep()} className="mb-8">
            <Step 
              title="Đặt hàng" 
              description="Đã gửi đơn" 
              icon={<ShoppingOutlined />} 
            />
            <Step 
              title="Chấp nhận" 
              description={order.status === 'pending' ? 'Chờ xác nhận' : 'Đã chấp nhận'}
              icon={order.status === 'pending' ? <LoadingOutlined /> : <CheckCircleOutlined />}
            />
            <Step 
              title="Thu hoạch" 
              description="Lập lịch thu hoạch"
              icon={<ScheduleOutlined />}
            />
            <Step 
              title="Hoàn thành" 
              description="Giao dịch hoàn tất"
              icon={order.status === 'completed' ? <FileDoneOutlined /> : <LoadingOutlined />}
            />
          </Steps>
        )}

        {/* Thông báo đơn hàng bị từ chối */}
        {order.status === 'rejected' && (
          <div className="bg-red-50 p-4 mb-6 rounded-md">
            <Title level={5} className="text-red-500">Đơn hàng đã bị từ chối</Title>
            {order.rejection_reason && (
              <Paragraph>
                <Text strong>Lý do: </Text>
                {order.rejection_reason}
              </Paragraph>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin sản phẩm */}
          <div>
            <Title level={4}>Thông tin sản phẩm</Title>
            <Card className="bg-gray-50">
              <div className="flex items-center">
                {/* Thay đổi cách truy cập hình ảnh */}
                {order.product_listing?.main_image_url && (
                  <img
                    src={order.product_listing.main_image_url}
                    alt={order.product_listing.title}
                    className="w-16 h-16 object-cover rounded-md mr-4"
                  />
                )}
                <div>
                  <Title level={5} className="mb-0">{order.product_listing.title}</Title>
                  <Text type="secondary">{order.product_listing.product_type}</Text>
                </div>
              </div>
              
              <Divider />
              
              <Descriptions column={1}>
                <Descriptions.Item label="Số lượng đặt mua">
                  {order.quantity} kg
                </Descriptions.Item>
                <Descriptions.Item label="Giá đề xuất">
                  {formatCurrency(Number(order.price))}/kg
                </Descriptions.Item>
                <Descriptions.Item label="Tổng giá trị">
                  {/* Sử dụng total_amount có sẵn */}
                  {formatCurrency(Number(order.total_amount))}
                </Descriptions.Item>
              </Descriptions>
              
              {order.note && (
                <>
                  <Divider />
                  <div>
                    <Text strong>Ghi chú:</Text>
                    <Paragraph className="bg-white p-3 rounded mt-2">
                      {order.note}
                    </Paragraph>
                  </div>
                </>
              )}
            </Card>
          </div>
          
          {/* Thông tin đối tác */}
          <div>
            <Title level={4}>
              {isSellerOfOrder ? 'Thông tin người mua' : 'Thông tin người bán'}
            </Title>
            <Card className="bg-gray-50">
              {isSellerOfOrder ? (
                <Descriptions column={1}>
                  <Descriptions.Item label="Tên">
                    {/* Thay đổi cách truy cập thông tin người dùng */}
                    {order.buyer.name || 'Không có thông tin'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {order.buyer.phone || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {order.buyer.address || 'Chưa cập nhật'}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Descriptions column={1}>
                  <Descriptions.Item label="Tên">
                    {/* Thay đổi cách truy cập thông tin người bán */}
                    {order.seller.name || 'Không có thông tin'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {order.seller.phone || 'Chưa cập nhật'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {order.seller.address || 'Chưa cập nhật'}
                  </Descriptions.Item>
                </Descriptions>
              )}
              
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={handleContact}
                className="mt-4"
                block
              >
                {isSellerOfOrder ? 'Nhắn tin với người mua' : 'Nhắn tin với người bán'}
              </Button>
            </Card>
            
            {/* QUAN TRỌNG: Hiển thị nút chấp nhận/từ chối đơn hàng cho người bán */}
            {isSellerOfOrder && order.status === 'pending' && (
              <Card className="mt-4 bg-blue-50">
                <Title level={5}>Hành động của người bán</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={showAcceptModal}
                    loading={actionLoading}
                    block
                  >
                    Chấp nhận đơn hàng
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setRejectModalVisible(true)}
                    block
                  >
                    Từ chối đơn hàng
                  </Button>
                </Space>
              </Card>
            )}
            
            {/* Hiển thị nút hoàn thành đơn hàng */}
            {order.status === 'accepted' && (
              <Card className="mt-4 bg-green-50">
                <Title level={5}>Hoàn thành giao dịch</Title>
                <Paragraph>
                  {isSellerOfOrder
                    ? 'Khi người mua đã nhận hàng và thanh toán đầy đủ, bạn có thể đánh dấu đơn hàng này là hoàn thành.'
                    : 'Sau khi nhận hàng và thanh toán, bạn có thể đánh dấu đơn hàng này là hoàn thành.'}
                </Paragraph>
                <Button
                  type="primary"
                  icon={<FileDoneOutlined />}
                  onClick={handleCompleteOrder}
                  loading={actionLoading}
                  block
                >
                  Đánh dấu hoàn thành
                </Button>
              </Card>
            )}
          </div>
        </div>
      </Card>

      {/* Modal từ chối đơn hàng */}
      <Modal
        title="Từ chối đơn hàng"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleRejectOrder}
        okText="Từ chối đơn hàng"
        okButtonProps={{ danger: true, loading: actionLoading }}
        cancelText="Hủy"
      >
        <div className="mb-4">
          <Text>Vui lòng cho người mua biết lý do bạn từ chối đơn hàng này:</Text>
        </div>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Ví dụ: Sản phẩm không đủ số lượng, giá đề xuất quá thấp..."
        />
      </Modal>

      {/* Modal lên lịch thu hoạch */}
      {scheduleModalVisible && order && (
        <ScheduleHarvestModal
          visible={scheduleModalVisible}
          onClose={() => setScheduleModalVisible(false)}
          productListingId={order.product_listing.id}
          traderId={order.buyer.user_id}
          onSuccess={() => {
            message.success('Đã lên lịch thu hoạch thành công!');
            setScheduleModalVisible(false);
          }}
        />
      )}

      {/* Modal xác nhận chấp nhận đơn hàng */}
      <Modal
        title="Xác nhận chấp nhận đơn hàng"
        open={acceptModalVisible}
        onOk={confirmAccept}
        onCancel={() => setAcceptModalVisible(false)}
        okText="Chấp nhận"
        cancelText="Hủy"
        okButtonProps={{ loading: actionLoading }}
      >
        <div className="flex items-center">
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '22px', marginRight: '8px' }} />
          <span>Sau khi chấp nhận, bạn sẽ được yêu cầu lên lịch thu hoạch cho đơn hàng này.</span>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
