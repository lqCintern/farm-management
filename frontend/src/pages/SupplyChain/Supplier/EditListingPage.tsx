// frontend/src/pages/SupplyChain/Supplier/EditListingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, Select, InputNumber, Upload, Card, Typography, message, Divider, Spin, Modal, DatePicker } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import supplyListingService from '../../../services/supply_chain/supplyListingService';
import { getUserProfile } from '../../../services/users/authService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Fetch user profile
        const profileResponse = await getUserProfile();
        setUserProfile(profileResponse);
        
        // Fetch categories
        const categoriesResponse = await supplyListingService.getCategories();
        setCategories(categoriesResponse.data);
        
        // Fetch listing details
        if (id) {
          const response = await supplyListingService.getSupplierListingById(Number(id));
          const listingData = response.data;
          
          // Format data for form, with datetime conversion for date fields
          form.setFieldsValue({
            name: listingData.name,
            category: listingData.category,
            price: listingData.price,
            unit: listingData.unit,
            quantity: listingData.quantity,
            description: listingData.description,
            brand: listingData.brand,
            manufacturer: listingData.manufacturer,
            manufacturing_date: listingData.manufacturing_date ? dayjs(listingData.manufacturing_date) : undefined,
            expiry_date: listingData.expiry_date ? dayjs(listingData.expiry_date) : undefined,
            // Ưu tiên dùng giá trị từ listing, nếu không có thì dùng từ profile
            province: listingData.province || '',
            district: listingData.district || '',
            ward: listingData.ward || '',
            address: listingData.address || (profileResponse as any).address || '',
            shelf_life: listingData.shelf_life,
            usage_instructions: listingData.usage_instructions,
            status: listingData.status,
          });

          // Setup image file list
          if (listingData.images && listingData.images.length > 0) {
            const images = listingData.images.map((img: any, index: number) => ({
              uid: `-${index}`,
              name: `image-${index}.png`,
              status: 'done',
              url: img.url,
              position: img.position,
              originFileObj: null,
            }));
            setFileList(images);
          }
        } else {
          // Nếu không có dữ liệu listing (trường hợp tạo mới)
          // Điền sẵn thông tin từ profile - chỉ có address
          form.setFieldsValue({
            address: (profileResponse as any)?.address || '',
            status: 'active', // Mặc định trạng thái là đang bán
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Không thể tải thông tin vật tư');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, form]);

  const handleFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Tạo FormData để gửi cả thông tin và file
      const formData = new FormData();
      
      // Xử lý các trường ngày tháng nếu có
      const processedValues = {...values};
      if (values.manufacturing_date) {
        processedValues.manufacturing_date = values.manufacturing_date.format('YYYY-MM-DD');
      }
      if (values.expiry_date) {
        processedValues.expiry_date = values.expiry_date.format('YYYY-MM-DD');
      }
      
      // Thêm các thông tin cơ bản
      Object.keys(processedValues).forEach(key => {
        if (processedValues[key] !== undefined && key !== 'images') {
          formData.append(`supply_listing[${key}]`, processedValues[key]);
        }
      });
      
      // Thêm các file hình ảnh mới
      let hasNewImages = false;
      fileList.forEach((file, index) => {
        // Chỉ gửi những file mới được tải lên
        if (file.originFileObj) {
          hasNewImages = true;
          formData.append(`images[]`, file.originFileObj);
        }
      });

      // Gửi flag xóa ảnh cũ nếu có ảnh mới
      if (hasNewImages) {
        formData.append('delete_all_images', 'true');
      }
      
      console.log('Sending update with data:', Object.fromEntries(formData));
      
      const response = await supplyListingService.updateListing(Number(id), formData);
      
      if (response.status === 'success') {
        message.success('Đã cập nhật vật tư thành công');
        navigate('/supplier/listings');
      } else {
        if (response.errors) {
          // Hiển thị lỗi từng trường
          Object.entries(response.errors).forEach(([field, errors]) => {
            form.setFields([{
              name: field,
              errors: Array.isArray(errors) ? errors : [errors]
            }]);
          });
        }
        message.error(response.message || 'Không thể cập nhật vật tư');
      }
    } catch (error: any) {
      console.error('Error updating listing:', error);
      message.error('Không thể cập nhật vật tư: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleImagePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  // Hàm xử lý khi chọn địa chỉ từ profile
  const fillAddressFromProfile = () => {
    if (!userProfile) return;
    
    form.setFieldsValue({
      address: userProfile.address || '',
      // Không điền các trường province, district, ward vì profile không có
    });
    
    message.success('Đã điền địa chỉ từ hồ sơ');
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        <span className="ml-2">Đang tải thông tin vật tư...</span>
      </div>
    );
  }

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

      <Title level={3} className="mb-6">Chỉnh sửa vật tư</Title>

      <Card className="mb-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
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
                  {categories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
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
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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
              
              {/* Ngày sản xuất và hết hạn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Ngày sản xuất" name="manufacturing_date">
                  <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder="Chọn ngày" />
                </Form.Item>
                
                <Form.Item label="Ngày hết hạn" name="expiry_date">
                  <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} placeholder="Chọn ngày" />
                </Form.Item>
              </div>
            </div>

            <div>
              <Title level={5} className="mb-4">Hình ảnh & Thông tin bổ sung</Title>
              
              <Form.Item
                label="Hình ảnh sản phẩm"
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
                    // Chỉ lưu file vào state, không gửi API ngay
                    try {
                      // Lưu tạm file và thông báo thành công
                      setTimeout(() => {
                        onSuccess && onSuccess("ok");
                      }, 100);
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
                
                <Form.Item label="Thời hạn sử dụng (tháng)" name="shelf_life">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              
              <Title level={5} className="mb-4 mt-4">
                Thông tin địa điểm
                {userProfile && (
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={fillAddressFromProfile}
                    className="ml-2"
                  >
                    Điền địa chỉ từ hồ sơ
                  </Button>
                )}
              </Title>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Tỉnh/Thành phố" name="province">
                  <Input placeholder="Tỉnh/Thành phố" />
                </Form.Item>
                
                <Form.Item label="Quận/Huyện" name="district">
                  <Input placeholder="Quận/Huyện" />
                </Form.Item>
                
                <Form.Item label="Phường/Xã" name="ward">
                  <Input placeholder="Phường/Xã" />
                </Form.Item>
                
                <Form.Item label="Địa chỉ cụ thể" name="address">
                  <Input placeholder="Số nhà, tên đường..." />
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
              Cập nhật
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Modal xem trước hình ảnh */}
      <Modal
        open={previewVisible}
        title="Xem trước hình ảnh"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        {previewImage && <img alt="preview" style={{ width: '100%' }} src={previewImage} />}
      </Modal>
    </div>
  );
};

export default EditListingPage;
