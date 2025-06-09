import { useState, useEffect } from "react";
import { Upload, Typography, Modal } from "antd";
import type { UploadProps } from "antd/es/upload";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const { Text } = Typography;

interface ImageUploadProps {
  uploadedImages: UploadFile[]; // Sử dụng UploadFile type từ antd
  onUpload: (file: File) => boolean | void;
  onRemove: (file: any) => void;
  maxCount?: number;
}

const ImageUploadSection: React.FC<ImageUploadProps> = ({
  uploadedImages = [],
  onUpload,
  onRemove,
  maxCount = 5
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  
  // Custom request để giữ tham chiếu đến đối tượng File gốc
  const customRequest = ({ file, onSuccess }: any) => {
    try {
      // Đảm bảo file là một đối tượng File
      const fileObj = file instanceof File ? file : file.originFileObj;
      
      if (!fileObj) {
        console.error("Invalid file object:", file);
        return;
      }
      
      // Log để debug
      console.log("Processing file upload:", fileObj.name, fileObj.size);
      
      // Gọi callback từ component cha và truyền vào đối tượng File
      onUpload(fileObj);
      
      // QUAN TRỌNG: Gọi onSuccess ngay lập tức, không dùng setTimeout
      onSuccess && onSuccess("ok");
    } catch (err) {
      console.error("Error in custom request:", err);
    }
  };

  const uploadProps: UploadProps = {
    name: "images",
    multiple: true,
    listType: "picture-card",
    accept: "image/*",
    customRequest,
    fileList: uploadedImages,
    beforeUpload: (file) => {
      // Kiểm tra kích thước
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        return false;
      }
      
      // Kiểm tra định dạng
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        return false;
      }
      
      return true;
    },
    onRemove: onRemove,
    onPreview: async (file) => {
      // Nếu có url, sử dụng nó
      if (file.url) {
        setPreviewImage(file.url);
        setPreviewOpen(true);
        setPreviewTitle(file.name || "Hình ảnh");
        return;
      }
      
      // Nếu có originFileObj, tạo URL từ đó
      if (file.originFileObj) {
        const url = URL.createObjectURL(file.originFileObj);
        setPreviewImage(url);
        setPreviewOpen(true);
        setPreviewTitle(file.name || "Hình ảnh");
      }
    },
  };

  return (
    <div className="my-4">
      <div className="mb-4">
        <Text type="secondary">Thêm hình ảnh của sản phẩm (tối đa {maxCount} ảnh)</Text>
      </div>

      <div>
        <Upload {...uploadProps}>
          {uploadedImages.length >= maxCount ? null : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Tải lên</div>
            </div>
          )}
        </Upload>

        <Modal
          open={previewOpen}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
        >
          <img 
            alt="preview" 
            style={{ width: "100%" }} 
            src={previewImage} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNOTAgODVDOTAgODguODY2IDg2Ljg2NiA5MiA8MCA9MkM3OS4xMzQgOTIgNzYgODguODY2IDc2IDg1Qzc2IDgxLjEzNCA3OS4xMzQgNzggODMgNzhDODYuODY2IDc4IDkwIDgxLjEzNCA5MCA4NVoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMTI0IDE1Mi4yNUw1MS4yNSA3MUw3MCA1MEwxMTAgOTBMMTYwIDU1TDE4NSA4NUwxMjQgMTUyLjI1WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+";
            }}
          />
        </Modal>
      </div>

      <div className="mt-2">
        <Text type="secondary">
          * Hình ảnh rõ nét sẽ giúp sản phẩm của bạn được chú ý nhiều hơn
        </Text>
      </div>
    </div>
  );
};

export default ImageUploadSection;
