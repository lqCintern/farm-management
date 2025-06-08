// frontend/src/pages/SupplyChain/Supplier/CreateListingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Select, InputNumber, Upload, Card, Typography, message, Divider } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import supplyListingService from '../../../services/supply_chain/supplyListingService';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Định nghĩa kiểu dữ liệu cho danh mục
interface CategoryOption {
  value: string;
  label: string;
}

const CreateListingPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await supplyListingService.getCategories();
        // Kiểm tra và chuyển đổi dữ liệu danh mục
        const formattedCategories = response.data.map((cat: any) => {
          if (typeof cat === 'object' && cat !== null) {
            // Nếu là object, trả về cấu trúc phù hợp
            return {
              value: cat.value || cat.id || cat.name,
              label: cat.label || cat.name || cat.value
            };
          }
          // Nếu là string, chuyển đổi thành object phù hợp
          return {
            value: cat,
            label: cat
          };
        });
        setCategories(formattedCategories);
      } catch (error) {
        message.error('Không thể tải danh mục');
      }
    };

    fetchCategories();
  }, []);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Tạo FormData để gửi cả thông tin và file
      const formData = new FormData();
      
      // Thêm các thông tin cơ bản
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && key !== 'images') {
          formData.append(`supply_listing[${key}]`, values[key]);
        }
      });
      
      // Thêm các file hình ảnh
      fileList.forEach((file, index) => {
        // Lấy file gốc từ originFileObj
        if (file.originFileObj) {
          formData.append(`images[]`, file.originFileObj);
        }
      });
      
      await supplyListingService.createListing(formData);
      message.success('Đã tạo vật tư thành công');
      navigate('/supplier/listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      message.error('Không thể tạo vật tư');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePreview = (file: any) => {
    setPreviewImage(file.url || file.thumbUrl);
  };

  const handleImageChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/supplier/listings')}
        >
          Quay lại danh sách
        </Button>
      </div>

      <Title level={3} className="mb-6">Thêm vật tư mới</Title>

      <Card className="mb-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            status: 'active',
            available_quantity: 1,
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Title level={5} className="mb-4">Thông tin cơ bản</Title>
              <Form.Item
                label="Tên vật tư"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên vật tư' }]}
              >
                <Input placeholder="Nhập tên vật tư" />
              </Form.Item>

              <Form.Item
                label="Danh mục"
                name="category"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map((category) => (
                    <Option key={category.value} value={category.value}>
                      {category.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="Giá bán"
                  name="price"
                  rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    placeholder="VNĐ"
                  />
                </Form.Item>

                <Form.Item
                  label="Đơn vị"
                  name="unit"
                  rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
                >
                  <Input placeholder="VD: kg, bao, chai..." />
                </Form.Item>

                <Form.Item
                  label="Số lượng sẵn có"
                  name="quantity"
                  rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  label="Trạng thái"
                  name="status"
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                >
                  <Select>
                    <Option value="active">Đang bán</Option>
                    <Option value="inactive">Dừng bán</Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item
                label="Mô tả"
                name="description"
              >
                <TextArea rows={5} placeholder="Mô tả chi tiết về vật tư..." />
              </Form.Item>
            </div>

            <div>
              <Title level={5} className="mb-4">Hình ảnh & Thông tin bổ sung</Title>
              
              <Form.Item
                label="Hình ảnh sản phẩm"
                name="images"
                extra="Tải lên tối đa 5 hình ảnh. Hình đầu tiên sẽ là hình chính."
              >
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handleImagePreview}
                  onChange={handleImageChange}
                  multiple
                  maxCount={5}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    // Store file objects in state, actual upload will happen in form submission
                    try {
                      // Just pass the validation, don't actually upload yet
                      onSuccess && onSuccess("ok");
                    } catch (error) {
                      onError && onError(new Error('Upload failed'));
                    }
                  }}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('Chỉ được tải lên file hình ảnh!');
                    }
                    const isLt2M = file.size / 1024 / 1024 < 2;
                    if (!isLt2M) {
                      message.error('Hình ảnh phải nhỏ hơn 2MB!');
                    }
                    return isImage && isLt2M;
                  }}
                >
                  {fileList.length >= 5 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Tải lên</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Thương hiệu" name="brand">
                  <Input placeholder="Tên thương hiệu" />
                </Form.Item>

                <Form.Item label="Nhà sản xuất" name="manufacturer">
                  <Input placeholder="Tên nhà sản xuất" />
                </Form.Item>
                
                <Form.Item label="Xuất xứ" name="origin">
                  <Input placeholder="Xuất xứ sản phẩm" />
                </Form.Item>

                <Form.Item label="Thời hạn sử dụng (tháng)" name="shelf_life">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>

              <Form.Item label="Hướng dẫn sử dụng" name="usage_instructions">
                <TextArea rows={3} placeholder="Hướng dẫn sử dụng vật tư..." />
              </Form.Item>
            </div>
          </div>

          <Divider />

          <Form.Item className="flex justify-end">
            <Button onClick={() => navigate('/supplier/listings')} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo mới
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateListingPage;
