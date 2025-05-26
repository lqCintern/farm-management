import { useState } from "react";
import { Upload, Typography, Modal } from "antd";
import type { RcFile, UploadProps } from "antd/es/upload";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const { Text } = Typography;

// Thay đổi interface để phù hợp với dữ liệu từ parent component
interface ImageUploadProps {
  uploadedImages: Array<{ url: string; name?: string; uid?: string }>;
  onUpload: (file: File) => void;
  onRemove: (file: any) => void;
}

const ImageUploadSection: React.FC<ImageUploadProps> = ({
  uploadedImages = [],
  onUpload,
  onRemove,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const uploadProps: UploadProps = {
    name: "images",
    multiple: true,
    listType: "picture-card",
    accept: "image/*",
    // Sử dụng trực tiếp uploadedImages vì đã có cấu trúc phù hợp với Ant Design
    fileList: uploadedImages.map((img, index) => ({
      uid: img.uid || `-${index}`,
      name: img.name || `image-${index}.jpg`,
      status: "done",
      url: img.url,
    })),
    beforeUpload: (file) => {
      onUpload(file);
      return false; // Prevent default upload behavior
    },
    onRemove: (file) => {
      onRemove(file);
    },
    onPreview: async (file) => {
      setPreviewImage(file.url || "");
      setPreviewOpen(true);
      setPreviewTitle(file.name || "Hình ảnh");
    },
  };

  return (
    <div className="my-4">
      <div className="mb-4">
        <Text type="secondary">Thêm hình ảnh của sản phẩm (tối đa 5 ảnh)</Text>
      </div>

      <div>
        <Upload {...uploadProps}>
          {uploadedImages.length >= 5 ? null : (
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
          <img alt="preview" style={{ width: "100%" }} src={previewImage} />
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
