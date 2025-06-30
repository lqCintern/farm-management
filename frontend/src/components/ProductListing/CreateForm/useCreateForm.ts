import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import { FormValues } from "./types";
import { createProductListing } from "@/services/marketplace/productListingsService";
import fieldService, { Field, FieldResponse } from "@/services/farming/fieldService";
import { getPineappleCropById } from "@/services/farming/pineappleCropService";
import { PineappleCrop } from "@/types/labor/types";

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
          setIsLoading(true);
          // Lấy dữ liệu field
          const fieldResponse = await fieldService.getFieldById(Number(fieldId));
          
          // Truy cập vào data theo cấu trúc API mới
          const fieldData = fieldResponse.data;

          console.log("Field data response:", fieldResponse);
          console.log("Field data:", fieldData);
          console.log("Current crop from field:", fieldData.currentCrop);

          if (fieldData) {
            // Tính toán tọa độ trung tâm của field
            const centerCoords = calculateCenter(fieldData.coordinates || []);
            
            // Parse area vì API trả về là string
            const parsedArea = fieldService.parseArea(
              fieldData.area !== undefined ? fieldData.area : 0
            );

            // Cập nhật state với dữ liệu field
            setFormValues((prev) => ({
              ...prev,
              fieldName: fieldData.name,
              field_id: fieldData.id,
              coordinates: fieldData.coordinates,
              location: fieldData.location, 
              latitude: centerCoords.lat,
              longitude: centerCoords.lng,
              // Thêm google maps URL
              google_maps_url: centerCoords.lat && centerCoords.lng 
                ? `https://www.google.com/maps/place/${centerCoords.lat},${centerCoords.lng}`
                : undefined,
            }));

            // Xử lý thông tin về crop
            if (fieldData.currentCrop) {
              console.log("Found currentCrop:", fieldData.currentCrop);
              
              // Clone object để tránh tham chiếu đến cùng một object
              const cropData = JSON.parse(JSON.stringify(fieldData.currentCrop));
              
              console.log("Formatted cropData before setting:", cropData);
              
              // Set tất cả dữ liệu cùng một lúc
              setFormValues((prev) => {
                const updatedValues = {
                  ...prev,
                  fieldName: fieldData.name,
                  field_id: fieldData.id,
                  coordinates: fieldData.coordinates,
                  location: fieldData.location,
                  latitude: centerCoords.lat,
                  longitude: centerCoords.lng,
                  google_maps_url: centerCoords.lat && centerCoords.lng 
                    ? `https://www.google.com/maps/place/${centerCoords.lat},${centerCoords.lng}`
                    : undefined,
                  // Crop data
                  product_type: cropData.variety || "Queen",
                  crop_animal_id: cropData.id,
                  pineapple_crop: cropData,
                  title: prev.title || `Dứa ${cropData.variety || "tươi"} từ ${fieldData.name}`,
                  description: prev.description || `Sản phẩm dứa ${cropData.variety || "tươi"} được trồng tại ${fieldData.location || "vùng đồng bằng Thanh Hóa"}, diện tích ${parsedArea.toLocaleString()} m².`,
                };

                // Nếu có harvest_date, tự động thiết lập khoảng thời gian thu hoạch
                if (cropData.harvest_date) {
                  const harvestDateObj = new Date(cropData.harvest_date);
                  
                  // Ngày bắt đầu: 7 ngày trước harvest_date
                  const startDate = new Date(harvestDateObj);
                  startDate.setDate(harvestDateObj.getDate() - 7);
                  
                  // Ngày kết thúc: 14 ngày sau harvest_date
                  const endDate = new Date(harvestDateObj);
                  endDate.setDate(harvestDateObj.getDate() + 14);
                  
                  // Format dates
                  updatedValues.harvest_start_date = startDate.toISOString().split('T')[0];
                  updatedValues.harvest_end_date = endDate.toISOString().split('T')[0];
                }
                
                console.log("Final form values being set:", updatedValues);
                return updatedValues;
              });
            } else {
              console.log("No currentCrop found in field data");
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          message.error("Không thể lấy thông tin vườn/cây trồng");
        } finally {
          setIsLoading(false);
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
      // Tính toán giá trị average_size từ min_size và max_size
      let averageSize = null;
      if (formValues.min_size && formValues.max_size) {
        averageSize = (formValues.min_size + formValues.max_size) / 2;
      }

      // Tính toán total_weight từ quantity và average_size
      let totalWeight = null;
      if (formValues.quantity && averageSize) {
        totalWeight = (formValues.quantity * averageSize) / 1000; // Chuyển đổi gram thành kg
      }

      // Chỉ giữ lại các field mà backend chấp nhận
      const filteredData = {
        title: formValues.title,
        description: formValues.description,
        status: formValues.status,
        product_type: formValues.product_type,
        quantity: formValues.quantity,
        total_weight: totalWeight, // Sử dụng giá trị đã tính toán
        average_size: averageSize, // Sử dụng giá trị đã tính
        price_expectation: formValues.price_expectation,
        province: formValues.province,
        district: formValues.district,
        ward: formValues.ward,
        address: formValues.address,
        latitude: formValues.latitude,
        longitude: formValues.longitude,
        harvest_start_date: formValues.harvest_start_date,
        harvest_end_date: formValues.harvest_end_date,
        crop_animal_id: formValues.pineapple_crop?.id || formValues.crop_animal_id || null,
      };

      // Lọc bỏ các giá trị null/undefined
      const cleanedData = Object.fromEntries(
        Object.entries(filteredData).filter(([key, value]) => value !== null && value !== undefined)
      );

      console.log("Final data being sent:", cleanedData);

      const formData = new FormData();

      // Thêm tất cả field vào FormData
      Object.entries(cleanedData).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return; // Bỏ qua các giá trị null/undefined
        }
        formData.append(`product_listing[${key}]`, value.toString());
      });

      // Xử lý images riêng
      if (uploadedImages.length > 0) {
        console.log(`Appending ${uploadedImages.length} images to FormData`);
        
        uploadedImages.forEach((image) => {
          formData.append("images[]", image);
        });
      }

      // Debug - kiểm tra các field được gửi đi
      console.log("FormData keys:", Array.from(formData.keys()));

      // Gửi request
      const response = await createProductListing(formData);
      console.log("Product created successfully:", response);
      message.success("Sản phẩm đã được đăng thành công");
      navigate("/products");
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
      // Tính toán giá trị average_size từ min_size và max_size
      let averageSize = null;
      if (formValues.min_size && formValues.max_size) {
        averageSize = (formValues.min_size + formValues.max_size) / 2;
      }

      // Tính toán total_weight từ quantity và average_size
      let totalWeight = null;
      if (formValues.quantity && averageSize) {
        totalWeight = (formValues.quantity * averageSize) / 1000; // Chuyển đổi gram thành kg
      }

      // Chỉ giữ lại các field mà backend chấp nhận
      const filteredData = {
        title: formValues.title || "Bản nháp",
        description: formValues.description,
        status: 0, // Draft status
        product_type: formValues.product_type,
        quantity: formValues.quantity,
        total_weight: totalWeight, // Sử dụng giá trị đã tính toán
        average_size: averageSize,
        price_expectation: formValues.price_expectation,
        province: formValues.province,
        district: formValues.district,
        ward: formValues.ward,
        address: formValues.address,
        latitude: formValues.latitude,
        longitude: formValues.longitude,
        harvest_start_date: formValues.harvest_start_date,
        harvest_end_date: formValues.harvest_end_date,
        crop_animal_id: formValues.pineapple_crop?.id || formValues.crop_animal_id,
      };

      const formData = new FormData();

      // Thêm tất cả field vào FormData
      Object.entries(filteredData).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        formData.append(`product_listing[${key}]`, value.toString());
      });

      // Xử lý images riêng
      if (uploadedImages.length > 0) {
        uploadedImages.forEach((image) => {
          formData.append("images[]", image);
        });
      }

      const response = await createProductListing(formData);
      message.success("Sản phẩm đã được lưu nháp");
      navigate("/products");
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
function dayjs(date: string) {
  const dateObj = new Date(date);
  let daysToAdd = 0;

  return {
    add: (days: number, unit: string) => {
      if (unit !== "day") throw new Error("Only 'day' unit is supported.");
      daysToAdd += days;
      const newDate = new Date(dateObj);
      newDate.setDate(newDate.getDate() + daysToAdd);
      
      return {
        format: (formatStr: string) => {
          // Only supports 'YYYY-MM-DD'
          if (formatStr !== "YYYY-MM-DD") throw new Error("Only 'YYYY-MM-DD' format is supported.");
          const year = newDate.getFullYear();
          const month = String(newDate.getMonth() + 1).padStart(2, "0");
          const day = String(newDate.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        },
      };
    },
    subtract: (days: number, unit: string) => {
      if (unit !== "day") throw new Error("Only 'day' unit is supported.");
      daysToAdd -= days;
      const newDate = new Date(dateObj);
      newDate.setDate(newDate.getDate() + daysToAdd);
      
      return {
        format: (formatStr: string) => {
          // Only supports 'YYYY-MM-DD'
          if (formatStr !== "YYYY-MM-DD") throw new Error("Only 'YYYY-MM-DD' format is supported.");
          const year = newDate.getFullYear();
          const month = String(newDate.getMonth() + 1).padStart(2, "0");
          const day = String(newDate.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        },
      };
    },
  };
}