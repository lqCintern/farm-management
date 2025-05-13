import { Form, DatePicker, Typography, Alert } from "antd";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const HarvestInfoSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  const [dateError, setDateError] = useState<string | null>(null);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      // Kiểm tra ngày bắt đầu < ngày kết thúc
      if (dates[0].isAfter(dates[1])) {
        setDateError("Ngày bắt đầu phải trước ngày kết thúc");
        return;
      }

      setDateError(null);
      setFormValues({
        ...formValues,
        harvest_start_date: dates[0].format("YYYY-MM-DD"),
        harvest_end_date: dates[1].format("YYYY-MM-DD"),
      });
    } else {
      setDateError(null);
      setFormValues({
        ...formValues,
        harvest_start_date: null,
        harvest_end_date: null,
      });
    }
  };

  useEffect(() => {
    // Kiểm tra lỗi mỗi khi formValues thay đổi
    if (formValues.harvest_start_date && formValues.harvest_end_date) {
      const startDate = dayjs(formValues.harvest_start_date);
      const endDate = dayjs(formValues.harvest_end_date);
      
      if (startDate.isAfter(endDate)) {
        setDateError("Ngày bắt đầu phải trước ngày kết thúc");
      } else {
        setDateError(null);
      }
    }
  }, [formValues.harvest_start_date, formValues.harvest_end_date]);

  return (
    <div>
      <Title level={4}>Thông tin thu hoạch</Title>
      <Text type="secondary" className="mb-4 block">
        Chọn khoảng thời gian sẵn sàng thu hoạch sản phẩm
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Thời gian thu hoạch"
          required
          validateStatus={(errors.harvest_start_date || errors.harvest_end_date || dateError) ? "error" : ""}
          help={dateError || errors.harvest_start_date || errors.harvest_end_date}
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

        {formValues.harvest_start_date && formValues.harvest_end_date && !dateError && (
          <Alert
            message="Thông tin thu hoạch"
            description={`Sản phẩm sẽ sẵn sàng để thu hoạch từ ${dayjs(formValues.harvest_start_date).format('DD/MM/YYYY')} 
            đến ${dayjs(formValues.harvest_end_date).format('DD/MM/YYYY')}`}
            type="info"
            showIcon
          />
        )}
      </Form>
    </div>
  );
};

export default HarvestInfoSection;
