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

  // Kiểm tra nếu đã có thông tin từ pineapple_crop
  const hasCropInfo = formValues.pineapple_crop && formValues.pineapple_crop.current_stage === "harvesting";

  // Sử dụng harvest_date từ API nếu có khi component mount
  useEffect(() => {
    if (formValues.pineapple_crop?.harvest_date && !formValues.harvest_start_date) {
      // Nếu có harvest_date từ vụ mùa và chưa set trước đó
      const harvestDate = dayjs(formValues.pineapple_crop.harvest_date);
      // Tự động thiết lập khoảng thời gian thu hoạch là 7 ngày trước và sau ngày thu hoạch dự kiến
      setFormValues({
        ...formValues,
        harvest_start_date: harvestDate.subtract(7, 'day').format('YYYY-MM-DD'),
        harvest_end_date: harvestDate.add(7, 'day').format('YYYY-MM-DD')
      });
    }
  }, [formValues.pineapple_crop]);

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
      
      {hasCropInfo && (
        <Alert
          message="Trạng thái cây trồng: Đang thu hoạch"
          description="Hệ thống đã xác định cây trồng của bạn đang trong giai đoạn thu hoạch."
          type="success"
          showIcon
          className="mb-4"
        />
      )}

      {/* Hiển thị thêm thông tin từ pineapple_crop nếu có */}
      {formValues.pineapple_crop?.harvest_date && (
        <Alert
          message="Ngày thu hoạch dự kiến"
          description={`Theo kế hoạch vụ mùa, ngày thu hoạch dự kiến là: ${dayjs(formValues.pineapple_crop.harvest_date).format('DD/MM/YYYY')}`}
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      <Text type="secondary" className="mb-4 block">
        Chọn khoảng thời gian sẵn sàng thu hoạch sản phẩm
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Thời gian thu hoạch"
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
            description={`Sản phẩm sẵn sàng thu hoạch từ ${dayjs(formValues.harvest_start_date).format('DD/MM/YYYY')} 
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
