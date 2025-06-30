import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Typography, Descriptions, Button, Divider, Tag, Steps, message, 
  Modal, Input, Space, Skeleton, Form, InputNumber, Select
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, 
  MessageOutlined, ArrowLeftOutlined, FileDoneOutlined, 
  ShoppingOutlined, ScheduleOutlined, ScissorOutlined
} from '@ant-design/icons';
import {
  getProductOrderById,
  updateProductOrderStatus,
} from '@/services/marketplace/productOrderService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import ScheduleHarvestModal from '@/components/Conversation/ScheduleHarvestModal';
import { createMarketplaceHarvest } from '@/services/marketplace/harvestService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { confirm } = Modal;
const { TextArea } = Input;
const { Option } = Select;

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
  const [recordHarvestModalVisible, setRecordHarvestModalVisible] = useState(false);
  const [recordHarvestForm] = Form.useForm();
  const [recordHarvestLoading, setRecordHarvestLoading] = useState(false);
  
  // Lấy thông tin người dùng từ localStorage
  const userInfo = getUserInfo();
  const currentUserId = userInfo?.user_id;
  
  // Đảm bảo so sánh đúng giữa id và user_id
  const getId = (obj: any) => obj?.id ?? obj?.user_id;
  const isSellerOfOrder = currentUserId && getId(order?.seller) === currentUserId;
  const isBuyerOfOrder = currentUserId && getId(order?.buyer) === currentUserId;
  
  // Debug log
  console.log('=== Debug Order Detail ===');
  console.log('currentUserId:', currentUserId);
  console.log('order?.seller:', order?.seller);
  console.log('order?.buyer:', order?.buyer);
  console.log('isSellerOfOrder:', isSellerOfOrder);
  console.log('isBuyerOfOrder:', isBuyerOfOrder);
  console.log('order?.status:', order?.status);
  console.log('========================');
  
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
    console.log('=== handleCompleteOrder called ===');
    console.log('Order ID:', id);
    console.log('Current user ID:', currentUserId);
    
    // Thay thế Modal.confirm bằng window.confirm
    const userConfirmed = window.confirm(
      'Xác nhận hoàn thành đơn hàng?\n\nKhi xác nhận hoàn thành, đơn hàng sẽ được đánh dấu là đã giao dịch xong và không thể thay đổi.'
    );
    
    if (userConfirmed) {
      completeOrderAction();
    }
  };

  const completeOrderAction = async () => {
    try {
      console.log('=== Starting complete order ===');
      setActionLoading(true);
      console.log('Calling updateProductOrderStatus with:', Number(id), 'complete');
      await updateProductOrderStatus(Number(id), 'complete');
      console.log('=== Order completed successfully ===');
      message.success('Đã đánh dấu đơn hàng hoàn thành');
      fetchOrderDetail();
    } catch (error) {
      console.error('Error completing order:', error);
      message.error('Không thể hoàn thành đơn hàng');
    } finally {
      setActionLoading(false);
    }
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

  const handleRecordHarvest = async () => {
    try {
      const values = await recordHarvestForm.validateFields();
      setRecordHarvestLoading(true);

      // Tạo marketplace harvest với thông tin thu hoạch thực tế
      const harvestData = {
        marketplace_harvest: {
          scheduled_date: new Date().toISOString(),
          location: values.location,
          actual_quantity: values.actual_quantity,
          estimated_quantity: values.actual_quantity, // Sử dụng số lượng thực tế làm ước tính
          notes: `Ghi nhận thu hoạch từ đơn hàng #${order.id} - ${values.notes || ''}`,
          status: 'completed' // Đánh dấu hoàn thành ngay
        },
        product_listing_id: order.product_listing.id,
        trader_id: order.buyer.user_id,
        product_order_id: order.id
      };

      await createMarketplaceHarvest(harvestData);

      // Cập nhật trạng thái đơn hàng thành completed
      await updateProductOrderStatus(order.id, 'complete');

      message.success('Đã ghi nhận thu hoạch thành công!');
      setRecordHarvestModalVisible(false);
      recordHarvestForm.resetFields();
      
      // Refresh order data
      fetchOrderDetail();
    } catch (error) {
      console.error('Error recording harvest:', error);
      message.error('Không thể ghi nhận thu hoạch. Vui lòng thử lại!');
    } finally {
      setRecordHarvestLoading(false);
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
                <Descriptions.Item label="Sản lượng đặt mua">
                  {order.total_weight || order.quantity} kg
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
            
            {/* Nút lên lịch thu hoạch cho đơn hàng đã chấp nhận */}
            {isSellerOfOrder && order.status === 'accepted' && (
              <Card className="mt-4 bg-green-50">
                <Title level={5}>Lên lịch thu hoạch</Title>
                <Paragraph>
                  Đơn hàng đã được chấp nhận. Bạn có thể lên lịch thu hoạch hoặc ghi nhận thu hoạch ngay.
                </Paragraph>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<ScheduleOutlined />}
                    onClick={() => setScheduleModalVisible(true)}
                    block
                  >
                    Lên lịch thu hoạch
                  </Button>
                  <Button
                    type="primary"
                    icon={<ScissorOutlined />}
                    onClick={() => setRecordHarvestModalVisible(true)}
                    block
                  >
                    Ghi nhận thu hoạch
                  </Button>
                </Space>
              </Card>
            )}
            
            {/* Hiển thị nút hoàn thành đơn hàng */}
            {(() => {
              console.log('=== Rendering complete button ===', { orderStatus: order.status, isSeller: isSellerOfOrder, isBuyer: isBuyerOfOrder });
              return order.status === 'accepted' && (
                <Card className="mt-4 bg-green-50">
                  <Title level={5}>Hoàn thành giao dịch</Title>
                  <Paragraph>
                    {isSellerOfOrder
                      ? 'Khi người mua đã nhận hàng và thanh toán đầy đủ, bạn có thể đánh dấu đơn hàng này là hoàn thành.'
                      : 'Sau khi nhận hàng và thanh toán, bạn có thể đánh dấu đơn hàng này là hoàn thành.'}
                  </Paragraph>
                  <button
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={handleCompleteOrder}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FileDoneOutlined />
                        Đánh dấu hoàn thành
                      </>
                    )}
                  </button>
                </Card>
              );
            })()}
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
          productListing={order.product_listing}
          order={order}
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

      {/* Modal ghi nhận thu hoạch */}
      <Modal
        title="Ghi nhận thu hoạch"
        open={recordHarvestModalVisible}
        onCancel={() => setRecordHarvestModalVisible(false)}
        onOk={handleRecordHarvest}
        okText="Ghi nhận"
        cancelText="Hủy"
        okButtonProps={{ loading: recordHarvestLoading }}
        width={600}
      >
        <Form form={recordHarvestForm} layout="vertical">
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <p className="font-medium text-blue-700 mb-1">Thông tin đơn hàng:</p>
            <p className="text-sm">Sản phẩm: {order?.product_listing?.title}</p>
            <p className="text-sm">Sản lượng đặt: {order?.total_weight || order?.quantity} kg</p>
            <p className="text-sm">Người mua: {order?.buyer?.name}</p>
          </div>

          <Form.Item
            name="actual_quantity"
            label="Số lượng thực tế thu hoạch (kg)"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng thu hoạch' },
              { type: 'number', min: 0.1, message: 'Số lượng phải lớn hơn 0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              addonAfter="kg" 
              placeholder="Nhập số lượng thực tế"
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Địa điểm thu hoạch"
            rules={[
              { required: true, message: 'Vui lòng chọn địa điểm thu hoạch' }
            ]}
          >
            <Select placeholder="Chọn địa điểm thu hoạch">
              {order?.product_listing?.field && (
                <Option value={order.product_listing.field.name}>
                  {order.product_listing.field.name}
                </Option>
              )}
              <Option value="Khu vực khác">Khu vực khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea 
              rows={3} 
              placeholder="Thông tin thêm về việc thu hoạch (tùy chọn)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
