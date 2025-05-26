import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, message } from 'antd';
import { createProductOrder } from '@/services/marketplace/productOrderService';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatters';

interface CreateOrderFormProps {
  visible: boolean;
  onClose: () => void;
  productListing: any;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  visible,
  onClose,
  productListing,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await createProductOrder({
        product_order: {
          product_listing_id: productListing.id,
          quantity: values.quantity,
          price: values.price,
          note: values.note,
        },
      }) as { conversation_id?: string };

      message.success('Đã gửi đơn đặt hàng thành công!');
      
      if (response.conversation_id) {
        navigate(`/chat/${response.conversation_id}`);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      message.error('Không thể gửi đơn đặt hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Đặt mua sản phẩm: ${productListing.title}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Gửi đơn đặt hàng
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="font-medium">Thông tin sản phẩm:</p>
          <p>Loại: {productListing.product_type}</p>
          <p>Giá đề xuất: {formatCurrency(productListing.price_expectation)}/kg</p>
          <p>Số lượng hiện có: {productListing.quantity} kg</p>
        </div>

        <Form.Item
          name="quantity"
          label="Số lượng muốn mua (kg)"
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng' },
            {
              type: 'number',
              min: 1,
              max: productListing.quantity,
              message: `Số lượng phải từ 1 đến ${productListing.quantity} kg`,
            },
          ]}
          initialValue={Math.min(productListing.quantity, 100)}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            addonAfter="kg" 
            placeholder="Nhập số lượng" 
          />
        </Form.Item>

        <Form.Item
          name="price"
          label="Giá đề xuất (đ/kg)"
          rules={[{ required: true, message: 'Vui lòng nhập giá đề xuất' }]}
          initialValue={productListing.price_expectation}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            addonAfter="đ/kg"
            placeholder="Nhập giá đề xuất"
          />
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <Input.TextArea
            rows={4}
            placeholder="Thêm yêu cầu đặc biệt hoặc ghi chú về đơn hàng"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateOrderForm;