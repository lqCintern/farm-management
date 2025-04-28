import { useState } from "react";
import { Button, Card, Steps } from "antd";
import BasicInfoSection from "./BasicInfoSection";
import PricingSection from "./PricingSection";
import LocationSection from "./LocationSection";
import HarvestInfoSection from "./HarvestInfoSection";
import ImageUploadSection from "./ImageUploadSection";
import { useCreateForm } from "./useCreateForm";

export function CreateProductListingForm() {
  const [current, setCurrent] = useState(0);
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
        <ImageUploadSection
          onUpload={handleImageUpload}
          onRemove={handleRemoveImage}
          uploadedImages={uploadedImages}
        />
      ),
    },
  ];

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({ key: item.title, title: item.title }));

  return (
    <Card
      title="Đăng sản phẩm mới"
      className="w-full max-w-4xl mx-auto shadow-md"
    >
      <Steps current={current} items={items} className="mb-8" />

      <div className="p-4 bg-gray-50 rounded-md min-h-[300px]">
        {steps[current].content}
      </div>

      <div className="flex justify-between mt-6">
        {current > 0 && <Button onClick={prev}>Quay lại</Button>}

        <div className="flex gap-2 ml-auto">
          <Button onClick={saveDraft} disabled={isLoading}>
            Lưu nháp
          </Button>

          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Tiếp theo
            </Button>
          )}

          {current === steps.length - 1 && (
            <Button type="primary" onClick={handleSubmit} loading={isLoading}>
              Đăng bài
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default CreateProductListingForm;
