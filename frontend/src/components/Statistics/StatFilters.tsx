import { useState, useEffect } from 'react';
import fieldService from '@/services/farming/fieldService';
import { getPineappleCrops } from '@/services/farming/pineappleCropService';
import Button from '@/components/common/Button';
import DateRangePicker from '@/components/common/DateRangePicker';
import Select from '@/components/common/Select';

interface StatFiltersProps {
  filters: {
    startDate: Date;
    endDate: Date;
    fieldId: string;
    cropId: string;
  };
  onChange: (filters: any) => void;
}

export default function StatFilters({ filters, onChange }: StatFiltersProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách ruộng
        const fieldsResult = await fieldService.getFields();
        setFields(fieldsResult.data || []);
        
        // Lấy danh sách cây trồng
        const cropsResult = await getPineappleCrops();
        setCrops(cropsResult.items || []);
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Cập nhật để phù hợp với DateRangePicker mới
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setTempFilters({
      ...tempFilters,
      startDate,
      endDate
    });
  };

  const handleFieldChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTempFilters({
      ...tempFilters,
      fieldId: event.target.value
    });
  };

  const handleCropChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTempFilters({
      ...tempFilters,
      cropId: event.target.value
    });
  };

  const handleApplyFilters = () => {
    onChange(tempFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
      endDate: new Date(),
      fieldId: '',
      cropId: ''
    };
    setTempFilters(resetFilters);
    onChange(resetFilters);
  };

  // Tạo options cho các select components
  const fieldOptions = [
    { value: '', label: 'Tất cả ruộng' },
    ...fields.map(field => ({ value: String(field.id), label: field.name }))
  ];

  const cropOptions = [
    { value: '', label: 'Tất cả cây trồng' },
    ...crops.map(crop => ({ value: String(crop.id), label: crop.name }))
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời gian
          </label>
          <DateRangePicker
            startDate={tempFilters.startDate}
            endDate={tempFilters.endDate}
            onChange={handleDateRangeChange}
          />
        </div>
        
        {/* Field Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ruộng
          </label>
          <Select
            value={tempFilters.fieldId}
            onChange={handleFieldChange}
            options={fieldOptions}
            className="w-full"
          />
        </div>
        
        {/* Crop Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cây trồng
          </label>
          <Select
            value={tempFilters.cropId}
            onChange={handleCropChange}
            options={cropOptions}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button
          buttonType="primary"
          onClick={handleApplyFilters}
        >
          Áp dụng
        </Button>
        <Button
          buttonType="secondary"
          onClick={handleResetFilters}
        >
          Đặt lại
        </Button>
      </div>
    </div>
  );
}