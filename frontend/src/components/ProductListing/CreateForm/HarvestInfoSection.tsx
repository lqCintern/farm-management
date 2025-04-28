import { Form, DatePicker, Typography, Select } from "antd";
import { useState, useEffect } from "react";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";
import { getCropAnimals } from "@/services/cropAnimalService";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface CropAnimal {
  id: number;
  name: string;
  crop_type: string;
}

const HarvestInfoSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  const [cropAnimals, setCropAnimals] = useState<CropAnimal[]>([]);

  useEffect(() => {
    const fetchCropAnimals = async () => {
      try {
        const data = await getCropAnimals(1); // Replace '1' with the appropriate argument
        setCropAnimals(data.crop_animals || []);
      } catch (error) {
        console.error("Error fetching crop animals:", error);
      }
    };

    fetchCropAnimals();
  }, []);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFormValues({
        ...formValues,
        harvest_start_date: dates[0].format("YYYY-MM-DD"),
        harvest_end_date: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setFormValues({
        ...formValues,
        harvest_start_date: null,
        harvest_end_date: null,
      });
    }
  };

  return (
    <div>
      <Title level={4}>Thông tin thu hoạch</Title>
      <Text type="secondary" className="mb-4 block">
        Thông tin về thời gian thu hoạch và loại cây trồng/vật nuôi
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Thời gian thu hoạch"
          validateStatus={errors.harvest_end_date ? "error" : ""}
          help={errors.harvest_end_date}
        >
          <RangePicker
            style={{ width: "100%" }}
            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            value={
              formValues.harvest_start_date && formValues.harvest_end_date
                ? [
                    dayjs(formValues.harvest_start_date),
                    dayjs(formValues.harvest_end_date),
                  ]
                : null
            }
            onChange={handleDateRangeChange}
          />
        </Form.Item>

        <Form.Item label="Liên kết với cây trồng/vật nuôi">
          <Select
            placeholder="Chọn cây trồng/vật nuôi"
            value={formValues.crop_animal_id || undefined}
            onChange={(value) =>
              setFormValues({
                ...formValues,
                crop_animal_id: value !== null ? Number(value) : null,
              })
            }
          >
            {cropAnimals.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.name} ({item.crop_type})
              </Option>
            ))}
          </Select>
          <Text type="secondary" className="mt-1 block">
            Liên kết sản phẩm với cây trồng/vật nuôi trong nhật ký của bạn
            (không bắt buộc)
          </Text>
        </Form.Item>
      </Form>
    </div>
  );
};

export default HarvestInfoSection;
