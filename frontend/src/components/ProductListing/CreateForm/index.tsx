import { useState, useEffect, useMemo } from "react";
import { Button, Card, Form, Tabs, Divider } from "antd";
import { useCreateForm } from "./useCreateForm";
import BasicInfoSection from "./BasicInfoSection";
import PricingSection from "./PricingSection";
import LocationSection from "./LocationSection";
import HarvestInfoSection from "./HarvestInfoSection";
import ImageUploadSection from "./ImageUploadSection";
import dayjs from "dayjs";

export function CreateProductListingForm() {
  const {
    formValues,
    isLoading,
    errors,
    setFormValues,
    handleSubmit,
    saveDraft,
    handleImageUpload,
    handleRemoveImage,
    uploadedImages,
  } = useCreateForm();

  // Preview panel scroll state
  const [previewFixed, setPreviewFixed] = useState(false);
  
  // Handle scroll for fixing preview panel
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setPreviewFixed(true);
      } else {
        setPreviewFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tạo previewUrls từ uploadedImages
  const previewUrls = useMemo(() => {
    return uploadedImages.map(file => URL.createObjectURL(file));
  }, [uploadedImages]);

  // Dọn dẹp URLs khi component unmount hoặc uploadedImages thay đổi
  useEffect(() => {
    return () => {
      // Giải phóng URL objects để tránh rò rỉ bộ nhớ
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  function formatHarvestEndDate(harvest_end_date: string) {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-medium mb-6">Đăng sản phẩm mới</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Form */}
        <div className="flex-1">
          <Card className="shadow-sm mb-6">
            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: 'Thông tin cơ bản',
                  children: (
                    <BasicInfoSection
                      formValues={formValues}
                      setFormValues={setFormValues}
                      errors={errors}
                    />
                  ),
                },
                {
                  key: 'pricing',
                  label: 'Giá cả & Số lượng',
                  children: (
                    <PricingSection
                      formValues={formValues}
                      setFormValues={setFormValues}
                      errors={errors}
                    />
                  ),
                },
                {
                  key: 'location',
                  label: 'Vị trí',
                  children: (
                    <LocationSection
                      formValues={formValues}
                      setFormValues={setFormValues}
                      errors={errors}
                    />
                  ),
                },
                {
                  key: 'harvest',
                  label: 'Thời gian thu hoạch',
                  children: (
                    <HarvestInfoSection
                      formValues={formValues}
                      setFormValues={setFormValues}
                      errors={errors}
                    />
                  ),
                },
              ]}
            />
          </Card>

          <Card title="Hình ảnh sản phẩm" className="shadow-sm mb-6">
            <ImageUploadSection
              uploadedImages={uploadedImages.map((file) => ({
                url: URL.createObjectURL(file),
                name: file.name,
                uid: file.name,
              }))}
              onUpload={handleImageUpload}
              onRemove={handleRemoveImage}
            />
          </Card>
          
          <div className="flex gap-4 mb-6">
            <Button size="large" onClick={saveDraft} disabled={isLoading}>
              Lưu nháp
            </Button>
            <Button 
              type="primary" 
              size="large" 
              onClick={handleSubmit} 
              loading={isLoading}
            >
              Đăng bài
            </Button>
          </div>
        </div>

        {/* Right side - Preview */}
        <div className="md:w-[400px]">
          <div 
            className={`bg-white rounded-lg shadow-sm p-4 ${previewFixed ? 'md:sticky md:top-4' : ''}`}
          >
            <div className="text-lg font-medium mb-2">Xem trước</div>
            
            {/* Phần xem trước */}
            {uploadedImages.length > 0 ? (
              <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden mb-4">
                <img 
                  src={previewUrls[0]} 
                  alt="Ảnh sản phẩm"
                  className="object-cover w-full h-full" 
                />
              </div>
            ) : (
              <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-gray-400">Chưa có ảnh sản phẩm</span>
              </div>
            )}
            
            <h2 className="text-xl font-bold">{formValues.title || "Tiêu đề"}</h2>
            <div className="text-lg font-semibold text-green-600 mt-1">
              {formValues.price_expectation ? `${Number(formValues.price_expectation).toLocaleString()} đ/kg` : "Giá"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formValues.address || "Vị trí"}
            </div>
            
            <Divider className="my-3" />
            
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Chi tiết</div>
              <div className="text-sm">
                {formValues.description || "Thông tin chi tiết sản phẩm"}
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Số lượng</div>
              <div className="text-sm">
                {formValues.quantity ? `${formValues.quantity} kg` : "Chưa có thông tin"}
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Thời gian thu hoạch dự kiến</div>
              <div className="text-sm">
                {formValues.harvest_end_date ? dayjs(formValues.harvest_end_date).format('DD/MM/YYYY') : "Chưa có thông tin"}
              </div>
            </div>
            
            <Divider className="my-3" />
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-3">
                <div className="font-medium">Người bán</div>
                <div className="text-sm text-gray-500">Thông tin liên hệ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateProductListingForm;
