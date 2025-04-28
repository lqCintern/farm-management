import { useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { createProductListing } from "../../../services/productListingsService";
import { FormValues } from "@/components/ProductListing/CreateForm/types";

export const useCreateForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    { id: number; url: string }[]
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formValues, setFormValues] = useState<FormValues>({
    title: "",
    product_type: "",
    description: "",
    quantity: null,
    average_size: null,
    price_expectation: null,
    province: "",
    district: "",
    ward: "",
    address: "",
    latitude: null,
    longitude: null,
    harvest_start_date: null,
    harvest_end_date: null,
    crop_animal_id: null,
    status: 1, // Active by default
  });

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
    console.log("Validation errors:", newErrors); // Debug
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      message.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Append form values
      Object.entries(formValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
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

      const response = (await createProductListing(formData)) as {
        message: string;
      };
      message.success(response.message || "Đăng bài thành công");
      navigate("/products");
    } catch (error) {
      console.error("Error creating product listing:", error);
      message.error("Đã có lỗi xảy ra khi đăng bài");
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    setFormValues({
      ...formValues,
      status: 0, // Draft status
    });

    setIsLoading(true);

    try {
      const formData = new FormData();

      // Append form values
      Object.entries({ ...formValues, status: 0 }).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
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

      const response = (await createProductListing(formData)) as {
        message: string;
      };
      message.success(response.message || "Đã lưu bản nháp");
      navigate("/products");
    } catch (error) {
      console.error("Error saving draft:", error);
      message.error("Đã có lỗi xảy ra khi lưu bản nháp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    setUploadedImages((prev) => [...prev, file]);
    return false; // Prevent default upload behavior
  };

  const handleRemoveImage = (file: File) => {
    setUploadedImages((prev) => prev.filter((f) => f !== file));
  };

  const handleRemoveExistingImage = (id: number) => {
    setExistingImages((prev) => prev.filter((image) => image.id !== id));
  };

  return {
    formValues,
    isLoading,
    errors,
    uploadedImages,
    existingImages,
    setFormValues,
    handleSubmit,
    saveDraft,
    handleImageUpload,
    handleRemoveImage,
    handleRemoveExistingImage,
  };
};
