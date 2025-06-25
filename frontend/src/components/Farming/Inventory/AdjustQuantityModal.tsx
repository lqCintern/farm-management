import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import { FarmMaterialInventory } from '@/services/farming/farmInventoryService';
import { X, Plus, Minus } from 'react-feather';

interface AdjustQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustment: { quantity: number; reason: string }) => void;
  material: FarmMaterialInventory;
}

const ADJUSTMENT_REASONS = [
  'Sử dụng cho hoạt động canh tác',
  'Nhập thêm vào kho',
  'Hỏng/hết hạn',
  'Điều chỉnh số liệu',
  'Chuyển sang kho khác',
  'Lý do khác'
];

const AdjustQuantityModal: React.FC<AdjustQuantityModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  material 
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      setError('Số lượng điều chỉnh phải lớn hơn 0');
      return;
    }
    
    if (!reason) {
      setError('Vui lòng chọn lý do điều chỉnh');
      return;
    }
    
    // Tính toán số lượng thực tế sẽ điều chỉnh (dương là tăng, âm là giảm)
    const actualAdjustment = adjustmentType === 'increase' ? quantity : -quantity;
    
    // Kiểm tra nếu là giảm số lượng, không được giảm quá số lượng hiện có
    if (adjustmentType === 'decrease' && quantity > material.quantity) {
      setError(`Không thể giảm quá ${material.quantity} ${material.unit} hiện có`);
      return;
    }
    
    const finalReason = reason === 'Lý do khác' ? customReason : reason;
    
    onSave({ 
      quantity: actualAdjustment, 
      reason: finalReason 
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Điều chỉnh số lượng">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Điều chỉnh số lượng</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Điều chỉnh số lượng cho vật tư: <span className="font-medium text-gray-900">{material.name}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Số lượng hiện tại: <span className="font-medium text-gray-900">{material.quantity} {material.unit}</span>
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại điều chỉnh
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('decrease')}
                    className={`flex-1 py-2 px-3 border rounded-md flex items-center justify-center ${
                      adjustmentType === 'decrease' 
                        ? 'bg-red-50 border-red-300 text-red-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <Minus size={16} className="mr-1" />
                    Giảm
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('increase')}
                    className={`flex-1 py-2 px-3 border rounded-md flex items-center justify-center ${
                      adjustmentType === 'increase' 
                        ? 'bg-green-50 border-green-300 text-green-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <Plus size={16} className="mr-1" />
                    Tăng
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng điều chỉnh
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setQuantity(isNaN(val) ? 0 : val);
                      setError('');
                    }}
                    min="0"
                    step="0.01"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                  <span className="ml-2 text-gray-600">{material.unit}</span>
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
              
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do điều chỉnh
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Chọn lý do --</option>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              
              {reason === 'Lý do khác' && (
                <div>
                  <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do khác
                  </label>
                  <input
                    type="text"
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    placeholder="Nhập lý do khác"
                  />
                </div>
              )}
              
              <div className="pt-3">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Số lượng sau điều chỉnh:
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {adjustmentType === 'increase' 
                        ? (material.quantity + quantity).toFixed(2) 
                        : Math.max(0, material.quantity - quantity).toFixed(2)
                      } {material.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  adjustmentType === 'increase'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
              >
                {adjustmentType === 'increase' ? 'Tăng số lượng' : 'Giảm số lượng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default AdjustQuantityModal;