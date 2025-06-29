import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

interface Field {
  id: number;
  name: string;
  area: number;
}

interface CropFormFieldsProps {
  name: string;
  setName: (value: string) => void;
  fieldId: number | '';
  setFieldId: (value: number | '') => void;
  plantingDate: string;
  setPlantingDate: (value: string) => void;
  fieldArea: number | '';
  setFieldArea: (value: number | '') => void;
  seasonType: string;
  setSeasonType: (value: string) => void;
  plantingDensity: number | '';
  setPlantingDensity: (value: number | '') => void;
  currentStage: string;
  setCurrentStage: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  variety: string;
  setVariety: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  fields: Field[];
  handleSelectField: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  SEASON_TYPES: Array<{ value: string; label: string }>;
  VARIETIES: Array<{ value: string; label: string }>;
}

const CropFormFields: React.FC<CropFormFieldsProps> = ({
  name,
  setName,
  fieldId,
  setFieldId,
  plantingDate,
  setPlantingDate,
  fieldArea,
  setFieldArea,
  seasonType,
  setSeasonType,
  plantingDensity,
  setPlantingDensity,
  currentStage,
  setCurrentStage,
  status,
  setStatus,
  description,
  setDescription,
  variety,
  setVariety,
  source,
  setSource,
  fields,
  handleSelectField,
  SEASON_TYPES,
  VARIETIES
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tên vụ */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Tên vụ trồng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
            placeholder="Nhập tên vụ trồng dứa"
            required
          />
        </div>
        
        {/* Chọn cánh đồng */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Cánh đồng <span className="text-red-500">*</span>
          </label>
          <select
            value={fieldId}
            onChange={handleSelectField}
            className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
            required
          >
            <option value="">Chọn cánh đồng</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} ({field.area.toLocaleString()} m²)
              </option>
            ))}
          </select>
        </div>
        
        {/* Ngày trồng */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Ngày trồng <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
              required
            />
            <FaCalendarAlt className="absolute right-4 top-4 text-green-300" />
          </div>
        </div>
        
        {/* Diện tích */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Diện tích (m²) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={fieldArea}
              onChange={(e) => setFieldArea(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
              placeholder="Nhập diện tích trồng"
              required
            />
            <span className="absolute right-4 top-4 text-green-300">m²</span>
          </div>
        </div>
        
        {/* Mùa vụ */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Mùa vụ
          </label>
          <select
            value={seasonType}
            onChange={(e) => setSeasonType(e.target.value)}
            className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
          >
            {SEASON_TYPES.map((season) => (
              <option key={season.value} value={season.value}>
                {season.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Mật độ trồng */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Mật độ trồng (cây/ha) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={plantingDensity}
              onChange={(e) => setPlantingDensity(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
              placeholder="Nhập mật độ trồng"
              required
              min="1"
            />
            <span className="absolute right-4 top-4 text-green-300">cây/ha</span>
          </div>
        </div>
        
        {/* Giống dứa */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Giống dứa
          </label>
          <select
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
          >
            {VARIETIES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Nguồn giống */}
        <div>
          <label className="block text-base font-semibold text-green-700 mb-2">
            Nguồn giống
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg"
            placeholder="Nhập nguồn giống"
          />
        </div>
      </div>
      
      {/* Mô tả */}
      <div>
        <label className="block text-base font-semibold text-green-700 mb-2">
          Mô tả
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-5 py-3 border-2 border-green-200 rounded-2xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-lg min-h-[80px]"
          placeholder="Mô tả chi tiết về vụ trồng"
        />
      </div>
    </>
  );
};

export default CropFormFields; 