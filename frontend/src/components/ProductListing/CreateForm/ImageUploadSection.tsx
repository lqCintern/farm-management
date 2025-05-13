import { useState } from "react";
import { Upload, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";

const { Title, Text } = Typography;

interface ImageUploadSectionProps {
  onUpload: (url: string) => void;
  onRemove: (url: string) => void;
  uploadedImages: string[] | undefined; // Thêm undefined vào kiểu dữ liệu
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  onUpload,
  onRemove,
  uploadedImages = [], // Thêm giá trị mặc định là mảng rỗng
}) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Convert uploaded images to file list format - thêm kiểm tra
  const initialFileList: UploadFile[] = uploadedImages ? uploadedImages.map((url, index) => ({
    uid: `-${index}`,
    name: `image-${index}.jpg`,
    status: 'done',
    url,
  })) : [];

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    
    if (!(file instanceof File)) {
      message.error('Vui lòng chọn một tệp hợp lệ');
      return;
    }

    setLoading(true);
    try {
      // Giả lập việc tải lên - trong thực tế, bạn sẽ gọi API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Giả định URL từ file upload
      const imageUrl = URL.createObjectURL(file);
      
      // Gọi callback để lưu URL vào state cha
      onUpload(imageUrl);
      
      // Cập nhật file list
      setFileList(prev => [
        ...prev,
        {
          uid: `${Date.now()}`,
          name: file.name,
          status: 'done',
          url: imageUrl,
        }
      ]);
      
      onSuccess && onSuccess("ok");
      message.success(`${file.name} tải lên thành công`);
    } catch (error) {
      onError && onError(new Error('Lỗi khi tải lên'));
      message.error(`${file.name} tải lên thất bại`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (file: UploadFile) => {
    const url = file.url || file.response;
    if (url) {
      onRemove(url);
    }
    return true;
  };

  return (
    <div>
      <Title level={4}>Hình ảnh sản phẩm</Title>
      <Text type="secondary" className="mb-4 block">
        Thêm hình ảnh để người mua dễ dàng hình dung sản phẩm của bạn
      </Text>

      <Upload
        listType="picture-card"
        fileList={fileList.length > 0 ? fileList : initialFileList}
        customRequest={handleUpload}
        onRemove={handleRemove}
        accept="image/*"
      >
        {(uploadedImages?.length || 0) >= 8 ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Tải lên</div>
          </div>
        )}
      </Upload>

      <div className="mt-4">
        <Text type="secondary">
          * Bạn có thể tải lên tối đa 8 hình ảnh, mỗi hình không quá 5MB
        </Text>
      </div>
    </div>
  );
};

export default ImageUploadSection;
