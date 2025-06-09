import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Steps, Button, message, Typography, Upload, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  getProductListingById,
  updateProductListing,
} from "@/services/marketplace/productListingsService";
import BasicInfoSection from "./CreateForm/BasicInfoSection";
import PricingSection from "./CreateForm/PricingSection";
import LocationSection from "./CreateForm/LocationSection";
import HarvestInfoSection from "./CreateForm/HarvestInfoSection";

const { Step } = Steps;
const { Title } = Typography;

export default function EditProductListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<any>({});
  
  // Thay thế các state phức tạp bằng một state fileList đơn giản
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  
  // Thêm state để theo dõi trạng thái upload
  const [uploading, setUploading] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        setInitialLoading(true);
        const response = await getProductListingById(parseInt(id)) as {
          product_listing: any;
          product_images: any[];
        };
        const product = response.product_listing;

        // Initialize form values
        setFormValues({
          title: product.title || "",
          product_type: product.product_type || "",
          description: product.description || "",
          quantity: product.quantity || null,
          average_size: product.average_size || null,
          price_expectation: product.price_expectation || null,
          province: product.province || "",
          district: product.district || "",
          ward: product.ward || "",
          address: product.address || "",
          harvest_start_date: product.harvest_start_date || null,
          harvest_end_date: product.harvest_end_date || null,
          crop_animal_id: product.crop_animal_id || null,
          status: product.status || 1,
          // Additional fields
          latitude: product.latitude || null,
          longitude: product.longitude || null,
          pineapple_crop: product.pineapple_crop || null,
          google_maps_url: product.google_maps_url || "",
        });

        console.log("Product images:", response.product_images);

        // Load existing images directly into fileList
        if (response.product_images && response.product_images.length > 0) {
          const existingImages = response.product_images.map((img: any, index: number) => ({
            uid: `existing-${img.id}`,
            name: `image-${index + 1}.jpg`,
            status: 'done', // Status "done" ngay từ đầu
            url: img.image_url,
            thumbUrl: img.image_url,
            isExisting: true,
            imageId: img.id,
          }));
          
          setFileList(existingImages);
        }
      } catch (err: any) {
        console.error("Failed to fetch product data:", err);
        message.error("Không thể tải thông tin sản phẩm");
        navigate("/my-products");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProductData();
  }, [id, navigate]);

  // Handle image preview like in CreateListingPage
  const handleImagePreview = (file: any) => {
    setPreviewImage(file.url || file.thumbUrl);
    setPreviewOpen(true);
    setPreviewTitle(file.name || "Hình ảnh");
  };

  // Handle image change like in CreateListingPage
  const handleImageChange = ({ fileList: newFileList, file }: any) => {
    console.log("File change event:", file);
    
    // Đánh dấu các file mới với trạng thái done
    const updatedFileList = newFileList.map((file: any) => {
      // Nếu file đang trong trạng thái uploading, chuyển sang done
      if (file.status === 'uploading') {
        return { ...file, status: 'done' };
      }
      return file;
    });
    
    // Kiểm tra xem file có originFileObj không
    updatedFileList.forEach((file: any, index: number) => {
      if (!file.isExisting && !file.originFileObj && file.status === 'done') {
        console.warn(`File at index ${index} missing originFileObj:`, file);
      }
    });
    
    setFileList(updatedFileList);
    
    // Kiểm tra còn file nào đang upload không
    const hasUploading = updatedFileList.some((f: any) => f.status === 'uploading');
    setUploading(hasUploading);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Minimum validation
    if (!formValues.title || formValues.title.trim() === "") {
      newErrors.title = "Vui lòng nhập tiêu đề";
    }
    
    if (!formValues.product_type) {
      newErrors.product_type = "Vui lòng chọn loại sản phẩm";
    }

    // For debugging
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Kiểm tra xem có ảnh đang upload không
    if (uploading) {
      message.warning("Vui lòng đợi tải ảnh hoàn tất trước khi cập nhật");
      return;
    }
    
    if (!validate()) {
      message.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    if (!id) {
      message.error("Không tìm thấy ID sản phẩm");
      return;
    }

    setIsLoading(true);
    console.log("Bắt đầu cập nhật sản phẩm...");

    try {
      const formData = new FormData();

      // Append form values
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          // Skip complex objects
          if (key !== "pineapple_crop" && typeof value !== 'object') {
            formData.append(`product_listing[${key}]`, String(value));
          }
        }
      });

      // Process images EXACTLY like in CreateListingPage
      const newImages: File[] = [];
      const retainedImageIds: number[] = [];
      
      // Kiểm tra xem có file nào đang ở trạng thái uploading
      const hasUploadingFiles = fileList.some(file => file.status === 'uploading');
      if (hasUploadingFiles) {
        setIsLoading(false);
        message.warning("Vui lòng đợi tải ảnh hoàn tất");
        return;
      }
      
      console.log("All files before processing:", fileList);

      // Separate files into new and existing
      fileList.forEach(file => {
        if (file.isExisting && file.imageId) {
          retainedImageIds.push(file.imageId);
          console.log(`Added existing image ID ${file.imageId} to retained list`);
        } else if (file.originFileObj) {
          newImages.push(file.originFileObj);
          console.log(`Added new image ${file.name} to upload list`);
        } else {
          console.warn("File missing required properties:", file);
        }
      });
      
      console.log("New images to upload:", newImages.length);
      console.log("Existing images to retain:", retainedImageIds);
      
      // Add new images to formData
      if (newImages.length > 0) {
        newImages.forEach(image => {
          formData.append("images[]", image);
          console.log(`Appended image to formData: ${image.name}, size: ${image.size}`);
        });
      }
      
      // Add retained image IDs
      if (retainedImageIds.length > 0) {
        // Sử dụng cú pháp có dấu [] để backend hiểu đây là array
        retainedImageIds.forEach(imageId => {
          formData.append("retained_image_ids[]", String(imageId));
          console.log(`Added retained_image_ids[]: ${imageId}`);
        });
      } else {
        // Thêm một phần tử rỗng để backend biết đây là mảng rỗng
        formData.append("retained_image_ids[]", "");
        console.log("Added empty retained_image_ids[]");
      }
      
      // Log all form data keys for debugging
      console.log("Form data keys:", Array.from(formData.keys()));
      
      // In trước khi gửi API để kiểm tra
      for (let [key, value] of formData.entries()) {
        if (key === "images[]") {
          const file = value as File;
          console.log(`${key}: ${file.name} (${file.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Call API
      const response = await updateProductListing(parseInt(id), formData);
      message.success("Cập nhật sản phẩm thành công");
      navigate(`/products/${id}`);
    } catch (error: any) {
      console.error("Error updating product:", error);
      message.error(
        error.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật sản phẩm"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const next = () => {
    if (validate()) {
      setCurrent(current + 1);
    } else {
      message.error("Vui lòng điền đầy đủ thông tin cần thiết");
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  // Image section component - similar to CreateListingPage
  const ImageSection = () => (
    <div className="my-4">
      <Title level={5}>Hình ảnh sản phẩm</Title>
      <div className="mb-4">
        <p className="text-gray-500">
          Thêm hình ảnh rõ nét sẽ giúp sản phẩm của bạn được chú ý hơn (tối đa 5 ảnh)
        </p>
      </div>

      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handleImagePreview}
        onChange={handleImageChange}
        multiple
        maxCount={5}
        customRequest={({ file, onSuccess }) => {
          // Gọi onSuccess ngay lập tức, không dùng setTimeout
          onSuccess && onSuccess("ok");
          // Không dùng setTimeout vì nó gây ra trạng thái uploading kéo dài
        }}
        beforeUpload={(file) => {
          const isImage = file.type.startsWith('image/');
          if (!isImage) {
            message.error('Chỉ được tải lên file hình ảnh!');
            return false;
          }
          const isLt5M = file.size / 1024 / 1024 < 5;
          if (!isLt5M) {
            message.error('Hình ảnh phải nhỏ hơn 5MB!');
            return false;
          }
          return true;
        }}
      >
        {fileList.length >= 5 ? null : (
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
          style={{ width: '100%' }}
          src={previewImage || ''}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNOTAgODVDOTAgODguODY2IDg2Ljg2NiA5MiA4MyA9MkM3OS4xMzQgOTIgNzYgODguODY2IDc2IDg1Qzc2IDgxLjEzNCA3OS4xMzQgNzggODMgNzhDODYuODY2IDc4IDkwIDgxLjEzNCA5MCA4NVoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMTI0IDE1Mi4yNUw1MS4yNSA3MUw3MCA1MEwxMTAgOTBMMTYwIDU1TDE4NSA4NUwxMjQgMTUyLjI1WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+";
          }}
        />
      </Modal>
      
      {/* Debug information */}
      <div className="mt-4 text-gray-500 text-sm">
        <p>Tổng số ảnh: {fileList.length}/5</p>
        <p>Ảnh đã tải lên: {fileList.filter(file => file.originFileObj).length}</p>
        <p>Ảnh hiện có: {fileList.filter(file => file.isExisting).length}</p>
        {uploading && <p className="text-yellow-500">Đang tải lên...</p>}
      </div>

      {/* Loại bỏ nút Cập nhật ở đây để tránh trùng lặp */}
    </div>
  );

  const steps = [
    {
      title: "Thông tin cơ bản",
      content: (
        <BasicInfoSection
          formValues={formValues}
          setFormValues={setFormValues}
          errors={errors}
        />
      ),
    },
    {
      title: "Giá cả & Số lượng",
      content: (
        <PricingSection
          formValues={formValues}
          setFormValues={setFormValues}
          errors={errors}
        />
      ),
    },
    {
      title: "Vị trí",
      content: (
        <LocationSection
          formValues={formValues}
          setFormValues={setFormValues}
          errors={errors}
        />
      ),
    },
    {
      title: "Thời gian thu hoạch",
      content: (
        <HarvestInfoSection
          formValues={formValues}
          setFormValues={setFormValues}
          errors={errors}
        />
      ),
    },
    {
      title: "Hình ảnh",
      content: <ImageSection />,
    },
  ];

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-md">
        <Steps current={current} className="mb-8">
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <div className="p-4 bg-gray-50 rounded-md min-h-[300px]">
          {steps[current].content}
        </div>

        <div className="flex justify-between mt-6">
          {current > 0 && <Button onClick={prev}>Quay lại</Button>}

          <div className="flex gap-2 ml-auto">
            {current < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Tiếp theo
              </Button>
            )}

            {current === steps.length - 1 && (
              <Button 
                type="primary" 
                onClick={handleSubmit} 
                loading={isLoading}
                disabled={isLoading || uploading}
              >
                {uploading ? "Đang tải ảnh..." : "Cập nhật sản phẩm"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
