import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import { FarmMaterialInventory } from '@/services/farming/farmInventoryService';
import { X } from 'react-feather';

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (materialData: any) => void;
  material: FarmMaterialInventory;
}

const MATERIAL_CATEGORIES = [
  'Phân bón',
  'Thuốc trừ sâu',
  'Thuốc diệt cỏ',
  'Hạt giống',
  'Dụng cụ',
  'Khác'
];

const UNITS = [
  'kg',
  'g',
  'l',
  'ml',
  'chai',
  'gói',
  'bao',
  'cái',
  'chiếc'
];

const EditMaterialModal: React.FC<EditMaterialModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  material 
}) => {
  const [formData, setFormData] = useState({
    name: material.name,
    quantity: material.quantity,
    unit: material.unit,
    category: material.category || '',
    purchase_price: material.purchase_price?.toString() || '',
    expiration_date: material.expiration_date || '',
    location: material.location || '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cập nhật formData khi material prop thay đổi
  useEffect(() => {
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      category: material.category || '',
      purchase_price: material.purchase_price?.toString() || '',
      expiration_date: material.expiration_date || '',
      location: material.location || '',
      notes: ''
    });
  }, [material]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi trường được chỉnh sửa
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên vật tư không được để trống';
    }
    
    if (formData.quantity < 0) {
      newErrors.quantity = 'Số lượng không được âm';
    }
    
    if (!formData.unit) {
      newErrors.unit = 'Vui lòng chọn đơn vị';
    }
    
    if (formData.purchase_price && isNaN(Number(formData.purchase_price))) {
      newErrors.purchase_price = 'Giá mua không hợp lệ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSave({
        ...formData,
        quantity: Number(formData.quantity),
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa vật tư">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Chỉnh sửa vật tư</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên vật tư <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên vật tư"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                      errors.quantity ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
                </div>
                
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                      errors.unit ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                    <option value="other">Khác</option>
                  </select>
                  {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit}</p>}
                </div>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {MATERIAL_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-1">
                    Giá mua (VNĐ)
                  </label>
                  <input
                    type="text"
                    id="purchase_price"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 ${
                      errors.purchase_price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nhập giá mua"
                  />
                  {errors.purchase_price && <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>}
                </div>
                
                <div>
                  <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Hạn sử dụng
                  </label>
                  <input
                    type="date"
                    id="expiration_date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Vị trí lưu trữ
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Vị trí lưu trữ"
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  placeholder="Nhập ghi chú"
                />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditMaterialModal;