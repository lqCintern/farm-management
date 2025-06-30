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
  const [quantity, setQuantity] = useState(form.getFieldValue('quantity') || 0);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const avgSize = parseFloat(productListing.average_size || '0');
      const qty = values.quantity || 0;
      const totalWeight = +(qty * avgSize / 1000);

      // Validate trước khi gửi
      if (!avgSize || !qty || isNaN(totalWeight) || totalWeight <= 0) {
        message.error('Vui lòng nhập số lượng và kích thước trung bình hợp lệ!');
        setLoading(false);
        return;
      }

      // Log debug giá trị gửi lên
      console.log('Gửi order:', {
        product_listing_id: productListing.id,
        quantity: values.quantity,
        price: values.price,
        note: values.note,
        total_weight: totalWeight,
        avgSize,
        qty
      });

      const response = await createProductOrder({
        product_order: {
          product_listing_id: productListing.id,
          quantity: values.quantity,
          price: values.price,
          note: values.note,
          total_weight: totalWeight
        },
      }) as { conversation_id?: string };
      message.success('Đã gửi đơn đặt hàng thành công!');
      if (response.conversation_id) {
        navigate(`/chat`);
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
          <p>Số lượng hiện có: {productListing.quantity} quả</p>
          <p>Size trung bình: {productListing.average_size} g/quả</p>
        </div>

        <Form.Item
          name="quantity"
          label="Số lượng muốn mua (quả)"
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng' },
            {
              type: 'number',
              min: 1,
              max: productListing.quantity,
              message: `Số lượng phải từ 1 đến ${productListing.quantity} quả`,
            },
          ]}
          initialValue={Math.min(productListing.quantity, 100)}
        >
          <InputNumber
            style={{ width: '100%' }}
            addonAfter="quả"
            placeholder="Nhập số lượng"
            value={quantity}
            onChange={(val) => {
              setQuantity(val || 0);
              form.setFieldsValue({ quantity: val });
            }}
          />
        </Form.Item>

        <Form.Item label="Tổng khối lượng ước tính (kg)">
          <Input
            value={((quantity || 0) * parseFloat(productListing.average_size || '0') / 1000).toFixed(2)}
            readOnly
            addonAfter="kg"
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
            parser={(value) => value!.replace(/\$\s?|,/g, '')}
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