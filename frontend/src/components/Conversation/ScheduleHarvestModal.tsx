import React, { useState } from 'react';
import { Form, DatePicker, Input, InputNumber, Modal } from 'antd';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { createMarketplaceHarvest } from '@/services/marketplace/harvestService';
import dayjs from 'dayjs'; // Thay moment bằng dayjs

interface ScheduleHarvestModalProps {
  visible: boolean;
  onClose: () => void;
  productListingId: number;
  traderId: number;
  onSuccess: () => void;
}

const ScheduleHarvestModal: React.FC<ScheduleHarvestModalProps> = ({
  visible,
  onClose,
  productListingId,
  traderId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const data = {
        marketplace_harvest: {
          ...values,
          // dayjs sử dụng cú pháp tương tự moment
          scheduled_date: values.scheduled_date.format('YYYY-MM-DD HH:mm:ss'),
        },
        product_listing_id: productListingId,
        trader_id: traderId,
      };
      
      await createMarketplaceHarvest(data);
      form.resetFields();
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error scheduling harvest:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Tạo giá trị mặc định - 8h sáng ngày mai
  const defaultDate = () => {
    const tomorrow = dayjs().add(1, 'day').hour(8).minute(0).second(0);
    return tomorrow;
  };
  
  return (
    <Modal
      title={
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
          <span>Lên lịch thu hoạch</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Xác nhận"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="scheduled_date"
          label="Thời gian thu hoạch"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          initialValue={defaultDate()}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            className="w-full"
            placeholder="Chọn ngày và giờ"
          />
        </Form.Item>
        
        <Form.Item
          name="location"
          label="Địa điểm thu hoạch"
          rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}
        >
          <Input placeholder="VD: Thửa đất số 10, xã An Bình" />
        </Form.Item>
        
        <Form.Item
          name="estimated_quantity"
          label="Số lượng dự kiến (kg)"
        >
          <InputNumber className="w-full" min={0} placeholder="VD: 100" />
        </Form.Item>
        
        <Form.Item
          name="estimated_price"
          label="Giá dự kiến (VND/kg)"
          tooltip="Giá mong muốn cho mỗi kg sản phẩm"
        >
          <InputNumber 
            className="w-full" 
            min={0} 
            step={1000}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined) => {
              return value ? Number(value.replace(/[^\d]/g, '')) : 0;
            }}
            placeholder="VD: 25,000"
          />
        </Form.Item>
        
        <Form.Item
          name="notes"
          label="Ghi chú"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Thông tin thêm về việc thu hoạch"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ScheduleHarvestModal;
