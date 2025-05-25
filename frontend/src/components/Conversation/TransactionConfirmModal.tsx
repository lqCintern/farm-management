import React, { useState } from 'react';
import { Form, DatePicker, Input, InputNumber, Modal, Upload, message } from 'antd';
import { CurrencyDollarIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { uploadPaymentProof } from '@/services/marketplace/harvestService';
import dayjs from 'dayjs'; // Thay thế moment bằng dayjs

interface TransactionConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  harvestId: number;
  onSuccess: () => void;
}

const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({
  visible,
  onClose,
  harvestId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (fileList.length === 0) {
        message.error('Vui lòng tải lên hình ảnh thanh toán');
        return;
      }
      
      setLoading(true);
      
      const formData = new FormData();
      formData.append('final_price', values.final_price);
      formData.append('payment_date', values.payment_date.format('YYYY-MM-DD HH:mm:ss'));
      
      if (values.notes) {
        formData.append('notes', values.notes);
      }
      
      // Add image file
      const file = fileList[0].originFileObj;
      if (file) {
        formData.append('image', file);
      }
      
      await uploadPaymentProof(harvestId, formData);
      
      message.success('Đã xác nhận giao dịch thành công');
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error confirming transaction:', error);
      message.error('Không thể xác nhận giao dịch');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageChange = ({ fileList }: any) => {
    setFileList(fileList.slice(-1)); // Only keep the last uploaded file
  };
  
  return (
    <Modal
      title={
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-500" />
          <span>Xác nhận thanh toán</span>
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
        initialValues={{
          payment_date: dayjs(), // Thay moment() bằng dayjs()
        }}
      >
        <Form.Item
          name="final_price"
          label="Số tiền thanh toán (VND)"
          rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
        >
          <InputNumber 
            className="w-full" 
            min={0} 
            step={1000}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: string | undefined) => {
              return value ? Number(value.replace(/[^\d]/g, '')) : 0;
            }}
            placeholder="VD: 1,000,000"
          />
        </Form.Item>
        
        <Form.Item
          name="payment_date"
          label="Thời gian thanh toán"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            className="w-full"
            placeholder="Chọn ngày và giờ"
          />
        </Form.Item>
        
        <Form.Item
          label="Hình ảnh thanh toán"
          rules={[{ required: true, message: 'Vui lòng tải lên hình ảnh' }]}
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleImageChange}
            beforeUpload={() => false}
            maxCount={1}
          >
            {fileList.length < 1 && (
              <div>
                <PlusOutlined />
                <div className="mt-2">Tải ảnh lên</div>
              </div>
            )}
          </Upload>
          <div className="text-gray-500 text-xs">
            <PhotoIcon className="h-4 w-4 inline mr-1" />
            Hình ảnh xác nhận giao dịch (chuyển khoản, biên lai, ...)
          </div>
        </Form.Item>
        
        <Form.Item
          name="notes"
          label="Ghi chú"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Thông tin thêm về giao dịch"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransactionConfirmModal;