import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import { FormValues } from "./types";
import { createProductListing } from "@/services/marketplace/productListingsService";
import fieldService from "@/services/farming/fieldService";
import { getPineappleCropById } from "@/services/farming/pineappleCropService";

export const useCreateForm = () => {
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get("fieldId");
  const cropId = searchParams.get("cropId");
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState<FormValues>({
    title: "",
    product_type: "",
    description: "",
    quantity: null,
    price_expectation: null,
    harvest_start_date: null,
    harvest_end_date: null,
    status: 1, // Default status (active)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  // Fetch field and crop data when component mounts
  useEffect(() => {
    const fetchFieldAndCropData = async () => {
      if (fieldId) {
        try {
          const fieldResponse = await fieldService.getFieldById(Number(fieldId));
          const fieldData = fieldResponse.data;

          if (fieldData) {
            const centerCoords = calculateCenter(fieldData.coordinates);

            setFormValues((prev) => ({
              ...prev,
              fieldName: fieldData.name,
              coordinates: fieldData.coordinates,
              latitude: centerCoords.lat,
              longitude: centerCoords.lng,
            }));

            if (cropId) {
              const response = await getPineappleCropById(Number(cropId));
              const cropData = (response as { data?: any }).data;
              if (cropData) {
                setFormValues((prev) => {
                  const newValues = {
                    ...prev,
                    product_type: cropData.variety,
                    crop_animal_id: cropData.id,
                    title: `Dứa ${cropData.variety || "tươi"} từ ${fieldData.name}`,
                  };
                  return newValues;
                });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          message.error("Không thể lấy thông tin vườn/cây trồng");
        }
      }
    };

    fetchFieldAndCropData();
  }, [fieldId, cropId]);

  const calculateCenter = (coordinates: Array<{ lat: number; lng: number }>) => {
    if (!coordinates || coordinates.length === 0) return { lat: 0, lng: 0 };

    const totalLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const totalLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);

    return {
      lat: totalLat / coordinates.length,
      lng: totalLng / coordinates.length,
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formValues.title) newErrors.title = "Vui lòng nhập tiêu đề";
    if (!formValues.quantity) newErrors.quantity = "Vui lòng nhập số lượng";
    if (!formValues.price_expectation) newErrors.price_expectation = "Vui lòng nhập giá mong muốn";
    if (!formValues.harvest_start_date) newErrors.harvest_start_date = "Vui lòng chọn ngày bắt đầu thu hoạch";
    if (!formValues.harvest_end_date) newErrors.harvest_end_date = "Vui lòng chọn ngày kết thúc thu hoạch";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Calculate total weight from quantity and size range
      let totalWeight = null;
      if (formValues.quantity && formValues.min_size && formValues.max_size) {
        const avgSize = (formValues.min_size + formValues.max_size) / 2;
        totalWeight = (formValues.quantity * avgSize) / 1000; // Convert to kg
      }

      const data = {
        ...formValues,
        total_weight: totalWeight,
      };

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        if (key === "coordinates" && Array.isArray(value)) {
          formData.append(`product_listing[${key}]`, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          if (key === "images") {
            value.forEach((item, idx) => {
              if (typeof item === "string") {
                formData.append(`images[]`, item);
              }
            });
          } else {
            formData.append(`product_listing[${key}]`, JSON.stringify(value));
          }
        } else if (typeof value === "object") {
          formData.append(`product_listing[${key}]`, JSON.stringify(value));
        } else {
          formData.append(`product_listing[${key}]`, value.toString());
        }
      });

      await createProductListing(formData);
      message.success("Sản phẩm đã được đăng thành công");
      navigate("/products"); // Redirect to products page
    } catch (error) {
      console.error("Error creating product:", error);
      message.error("Lỗi khi đăng sản phẩm. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  // Save as draft
  const saveDraft = async () => {
    setIsLoading(true);
    try {
      // Tương tự code ở trên nhưng cần thêm status: 0
      let totalWeight = null;
      if (formValues.quantity && formValues.min_size && formValues.max_size) {
        const avgSize = (formValues.min_size + formValues.max_size) / 2;
        totalWeight = (formValues.quantity * avgSize) / 1000;
      }

      const data = {
        ...formValues,
        total_weight: totalWeight,
        status: 0, // Draft status
      };

      // Convert data object to FormData - lồng ghép dữ liệu vào product_listing
      const formData = new FormData();

      // Thêm các trường dữ liệu với khóa "product_listing[field]"
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        if (key === "coordinates" && Array.isArray(value)) {
          formData.append(`product_listing[${key}]`, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          if (key === "images") {
            value.forEach((item, idx) => {
              if (typeof item === "string") {
                formData.append(`images[]`, item);
              }
            });
          } else {
            formData.append(`product_listing[${key}]`, JSON.stringify(value));
          }
        } else if (typeof value === "object") {
          formData.append(`product_listing[${key}]`, JSON.stringify(value));
        } else {
          formData.append(`product_listing[${key}]`, value.toString());
        }
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      message.error("Lỗi khi lưu nháp. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File): boolean => {
    setUploadedImages([...uploadedImages, file]);
    return true; // Trả về true để biểu thị thành công
  };

  // Handle remove image
  const handleRemoveImage = (file: File) => {
    setUploadedImages(uploadedImages.filter((item) => item.name !== file.name));
  };

  return {
    formValues,
    setFormValues,
    errors,
    isLoading,
    handleSubmit,
    saveDraft,
    handleImageUpload,
    handleRemoveImage,
    uploadedImages,
  };
};

// Minimal dayjs-like implementation for adding days and formatting dates
function dayjs(harvest_date: string) {
  return {
    add: (days: number, unit: string) => {
      if (unit !== "day") throw new Error("Only 'day' unit is supported.");
      const date = new Date(harvest_date);
      date.setDate(date.getDate() + days);
      return {
        format: (formatStr: string) => {
          // Only supports 'YYYY-MM-DD'
          if (formatStr !== "YYYY-MM-DD") throw new Error("Only 'YYYY-MM-DD' format is supported.");
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        },
      };
    },
  };
}