import { useState } from "react";
import { Upload, Typography, Modal } from "antd";
import type { RcFile, UploadProps } from "antd/es/upload";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const { Title, Text } = Typography;

interface ImageUploadProps {
  uploadedImages: File[];
  onUpload: (file: File) => boolean;
  onRemove: (file: File) => void;
}

const ImageUploadSection: React.FC<ImageUploadProps> = ({
  uploadedImages,
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
    fileList: uploadedImages.map(
      (file, index) =>
        ({
          uid: `-${index}`,
          name: file.name,
          status: "done",
          url: URL.createObjectURL(file),
          originFileObj: file as RcFile,
        } as UploadFile)
    ),
    beforeUpload: (file) => {
      onUpload(file);
      return false; // Prevent default upload behavior
    },
    onRemove: (file) => {
      if (file.originFileObj) {
        onRemove(file.originFileObj as File);
      }
    },
    onPreview: async (file) => {
      const src = file.url || (await getBase64(file.originFileObj as RcFile));
      setPreviewImage(src);
      setPreviewOpen(true);
      setPreviewTitle(file.name || "Image");
    },
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Tải lên</div>
    </div>
  );

  return (
    <div className="my-4">
      <Title level={4}>Hình ảnh sản phẩm</Title>
      <Text type="secondary">Thêm hình ảnh của sản phẩm (tối đa 5 ảnh)</Text>

      <div className="mt-4">
        <Upload {...uploadProps}>
          {uploadedImages.length >= 5 ? null : uploadButton}
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

// Helper function để chuyển file thành base64
const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default ImageUploadSection;
