import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Steps, Button, message } from "antd";
import {
  getProductListingById,
  updateProductListing,
  ProductListing,
} from "@/services/marketplace/productListingsService";
import BasicInfoSection from "./CreateForm/BasicInfoSection";
import PricingSection from "./CreateForm/PricingSection";
import LocationSection from "./CreateForm/LocationSection";
import HarvestInfoSection from "./CreateForm/HarvestInfoSection";
import ImageUploadSection from "./CreateForm/ImageUploadSection";

const { Step } = Steps;

export default function EditProductListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<any>({});
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        setInitialLoading(true);
        const response = await getProductListingById(parseInt(id));
        const product = (response as { product_listing: ProductListing })
          .product_listing;

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
        });

        // Load existing images
        if (product.product_images && product.product_images.length > 0) {
          setExistingImages(product.product_images);
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

  const handleImageUpload = (file: File) => {
    setUploadedImages((prev) => [...prev, file]);
    return false; // Prevent default upload
  };

  const handleRemoveImage = (file: File) => {
    setUploadedImages((prev) => prev.filter((f) => f !== file));
  };

  const handleRemoveExistingImage = (imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formValues.title) newErrors.title = "Vui lòng nhập tiêu đề";
    if (!formValues.product_type)
      newErrors.product_type = "Vui lòng chọn loại sản phẩm";
    if (!formValues.province) newErrors.province = "Vui lòng chọn tỉnh/thành";
    if (!formValues.district) newErrors.district = "Vui lòng chọn quận/huyện";
    if (!formValues.ward) newErrors.ward = "Vui lòng chọn phường/xã";

    // Numeric validation
    if (formValues.quantity !== null && formValues.quantity <= 0) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (
      formValues.price_expectation !== null &&
      formValues.price_expectation <= 0
    ) {
      newErrors.price_expectation = "Giá mong muốn phải lớn hơn 0";
    }

    // Date validation
    if (formValues.harvest_start_date && formValues.harvest_end_date) {
      const start = new Date(formValues.harvest_start_date);
      const end = new Date(formValues.harvest_end_date);

      if (end < start) {
        newErrors.harvest_end_date =
          "Ngày kết thúc thu hoạch phải sau ngày bắt đầu";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      message.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    if (!id) return;

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Append form values
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(`product_listing[${key}]`, String(value));
        }
      });

      // Append new images
      uploadedImages.forEach((image) => {
        formData.append("images[]", image);
      });

      // Append retained image IDs
      existingImages.forEach((image) => {
        formData.append("retained_image_ids[]", String(image.id));
      });

      // Gọi API cập nhật sản phẩm
      const response = (await updateProductListing(parseInt(id), formData)) as {
        message: string;
      };

      // Hiển thị thông báo thành công
      message.success(response.message || "Cập nhật sản phẩm thành công");

      // Điều hướng về trang chi tiết sản phẩm
      navigate(`/products/${id}`);
    } catch (error) {
      console.error("Error updating product:", error);
      message.error("Đã có lỗi xảy ra khi cập nhật sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

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
      content: (
        <div>
          {existingImages.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3">Hình ảnh hiện tại</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.image_url}
                      alt="Product"
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        danger
                        size="small"
                        onClick={() => handleRemoveExistingImage(image.id)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ImageUploadSection
            uploadedImages={uploadedImages}
            onUpload={handleImageUpload}
            onRemove={handleRemoveImage}
          />

          <p className="text-gray-500 mt-2">
            Tối đa 5 ảnh bao gồm cả ảnh hiện tại và ảnh mới.
          </p>
        </div>
      ),
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
              <Button type="primary" onClick={handleSubmit} loading={isLoading}>
                Cập nhật
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
