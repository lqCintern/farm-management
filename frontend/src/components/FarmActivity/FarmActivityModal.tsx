import { useState, useEffect } from "react";
import { createFarmActivity, getFarmMaterials } from "@/services/farming/farmService";
import fieldService from "@/services/farming/fieldService";
import "@/styles/modal.css";

interface MaterialItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

interface Field {
  id: number;
  name: string;
  area: number;
  currentCrop?: {
    id: number;
    name: string;
    crop_type: number;
    // Add other fields as needed
  }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (newActivity: any) => void;
}

export default function FarmActivityModal({
  isOpen,
  onClose,
  onAddActivity,
}: Props) {
  const [formData, setFormData] = useState({
    activity_type: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "pending",
    crop_animal_id: "",
    frequency: "",
    field_id: "",
  });
  
  const [materials, setMaterials] = useState<Record<string, number>>({});
  const [availableMaterials, setAvailableMaterials] = useState<MaterialItem[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Danh sách loại hoạt động
  const activityTypes = [
    { value: "soil_preparation", label: "Làm đất" },
    { value: "planting", label: "Trồng cây" },
    { value: "fertilizing", label: "Bón phân" },
    { value: "watering", label: "Tưới nước" },
    { value: "pesticide", label: "Phun thuốc" },
    { value: "pruning", label: "Tỉa cây" },
    { value: "weeding", label: "Làm cỏ" },
    { value: "harvesting", label: "Thu hoạch" },
    { value: "other", label: "Hoạt động khác" }
  ];
  
  // Hoạt động nào cần vật tư
  const materialRequiredActivities = ["fertilizing", "pesticide", "planting"];
  
  const requiresMaterials = materialRequiredActivities.includes(formData.activity_type);
  
  useEffect(() => {
    // Load danh sách vật tư khi mở modal
    if (isOpen) {
      fetchMaterials();
      fetchFields();
    }
  }, [isOpen]);
  
  const fetchFields = async () => {
    try {
      const response = await fieldService.getFields();
      if (response && response.data) {
        setFields(response.data.map((field: any) => ({
          id: field.id,
          name: field.name,
          area: field.area,
          currentCrop: field.currentCrop || []
        })));
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      setError('Không thể tải danh sách cánh đồng. Vui lòng thử lại sau.');
    }
  };
  
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await getFarmMaterials();
      
      // Xử lý cấu trúc dữ liệu trả về từ API
      let materialsData = [];
      if (response.materials && Array.isArray(response.materials.data)) {
        // Chuyển đổi từ cấu trúc JSONAPI sang dạng phẳng 
        interface MaterialAttributes {
          name: string;
          category: string;
          quantity: number;
          unit: string;
        }

        interface MaterialApiItem {
          id: number;
          attributes: MaterialAttributes;
        }

        materialsData = (response.materials.data as MaterialApiItem[]).map((item: MaterialApiItem): MaterialItem => ({
          id: item.id,
          ...item.attributes
        }));
      } else if (Array.isArray(response.data)) {
        // Cấu trúc cũ, giữ nguyên
        materialsData = response.data;
      }
      
      setAvailableMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Sửa lại hàm handleMaterialChange để đảm bảo ID dưới dạng number
  const handleMaterialChange = (materialId: string, quantity: number) => {
    // Chuyển materialId thành số
    const numericId = parseInt(materialId);
    
    if (quantity <= 0) {
      const updatedMaterials = { ...materials };
      delete updatedMaterials[numericId]; // Sử dụng ID dạng số
      setMaterials(updatedMaterials);
    } else {
      setMaterials({ ...materials, [numericId]: quantity }); // Sử dụng ID dạng số
    }
  };

  // Cập nhật handleSubmit để gửi vật tư đúng cách
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra nếu hoạt động yêu cầu vật tư nhưng không có
    if (requiresMaterials && Object.keys(materials).filter(k => materials[k] > 0).length === 0) {
      setError(`Hoạt động ${getActivityTypeLabel(formData.activity_type)} cần có ít nhất một vật tư`);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Lọc vật tư có số lượng > 0
      const formattedMaterials: Record<string, number> = {};
      Object.keys(materials).forEach(key => {
        const qty = materials[key];
        if (qty && qty > 0) {
          formattedMaterials[key] = qty;
        }
      });
      
      // Kiểm tra lại một lần nữa
      if (requiresMaterials && Object.keys(formattedMaterials).length === 0) {
        setError(`Hoạt động ${getActivityTypeLabel(formData.activity_type)} cần có ít nhất một vật tư`);
        return;
      }
      
      // Chuẩn bị dữ liệu gửi đi
      const dataToSubmit = {
        ...formData,
        materials: formattedMaterials
      };
      
      // Log dữ liệu trước khi gửi
      console.log("Submitting farm activity data:", dataToSubmit);
      
      const response = await createFarmActivity(dataToSubmit);
      console.log("Server response:", response);
      
      onAddActivity(response.data);
      
      // Reset form
      setFormData({
        activity_type: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "pending",
        crop_animal_id: "",
        frequency: "",
        field_id: "",
      });
      setMaterials({});
      
      onClose();
    } catch (error: any) {
      console.error("Lỗi khi tạo hoạt động nông nghiệp:", error);
      
      // Hiển thị thêm chi tiết về lỗi
      if (error.response) {
        console.log("Error status:", error.response.status);
        console.log("Error data:", error.response.data);
        
        if (error.response.status === 422) {
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            setError(error.response.data.errors[0]);
          } else if (typeof error.response.data.errors === 'object') {
            // Nếu errors là một đối tượng
            const firstError = Object.values(error.response.data.errors)[0];
            setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
          } else {
            setError('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
          }
        } else {
          setError(`Lỗi ${error.response.status}: ${error.message}`);
        }
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getActivityTypeLabel = (type: string): string => {
    const found = activityTypes.find(at => at.value === type);
    return found ? found.label : type;
  };
  
  // Lọc vật tư dựa vào loại hoạt động
  const getFilteredMaterials = () => {
    if (!formData.activity_type) return availableMaterials;
    
    // In ra để debug
    console.log("Available materials:", availableMaterials);
    
    switch (formData.activity_type) {
      case 'fertilizing':
        return availableMaterials.filter(m => m.category === 'fertilizer');
      case 'pesticide':
        return availableMaterials.filter(m => m.category === 'pesticide');
      case 'planting':
        return availableMaterials.filter(m => m.category === 'seed');
      default:
        return availableMaterials;
    }
  };

  const handleSelectField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    setFormData(prev => ({
      ...prev,
      field_id: selectedId.toString()
    }));
    
    // Tự động điền crop_animal_id nếu chọn cánh đồng
    if (selectedId) {
      const selectedField = fields.find(field => field.id === selectedId);
      if (selectedField) {
        const newFormData = {
          ...formData, 
          field_id: selectedId.toString()
        };
        
        // Đặt crop_animal_id nếu currentCrop tồn tại
        if (selectedField.currentCrop && selectedField.currentCrop.length > 0) {
          newFormData.crop_animal_id = selectedField.currentCrop[0].id.toString();
        }
        
        setFormData(newFormData);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-3xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white py-2 border-b z-10">Thêm hoạt động nông nghiệp</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Loại hoạt động
              </label>
              <select
                name="activity_type"
                value={formData.activity_type}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              >
                <option value="">Chọn loại hoạt động</option>
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Cánh đồng
              </label>
              <select
                name="field_id"
                value={formData.field_id}
                onChange={handleSelectField} // Use the custom handler
                className="w-full border rounded-lg p-2"
              >
                <option value="">Chọn cánh đồng</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.area.toLocaleString()} m²)
                    {field.currentCrop && field.currentCrop.length > 0 ? 
                      ` - ${field.currentCrop[0].name}` : ''}
                  </option>
                ))}
              </select>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Mã cây trồng/vật nuôi
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="crop_animal_id"
                  value={formData.crop_animal_id}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
                {formData.field_id && (() => {
                  const selectedField = fields.find(f => f.id === Number(formData.field_id));
                  return selectedField?.currentCrop?.length ? selectedField.currentCrop.length > 0 : false;
                })() && (
                  <div className="text-xs text-green-600 mt-1">
                    Đã tự động điền từ cây trồng hiện tại
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tần suất</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Chọn tần suất</option>
                <option value="once">Một lần</option>
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
            
            <div className="mb-4 md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                rows={3}
                required
              />
            </div>
          </div>
          
          {/* Phần vật tư */}
          {formData.activity_type && (
            <div className="mb-4 border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Vật tư sử dụng</h3>
                {requiresMaterials && (
                  <span className="text-sm text-red-500">* Bắt buộc chọn ít nhất một vật tư</span>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-4">Đang tải danh sách vật tư...</div>
              ) : getFilteredMaterials().length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <p>Không có vật tư phù hợp cho hoạt động này.</p>
                  <a href="/farming/materials/new" className="text-blue-600 underline">Thêm vật tư mới</a>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Tên vật tư</th>
                        <th className="text-left py-2">Đơn vị</th>
                        <th className="text-left py-2">Tồn kho</th>
                        <th className="text-left py-2">Số lượng sử dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredMaterials().map(material => (
                        <tr key={material.id} className="border-b">
                          <td className="py-2">{material.name}</td>
                          <td className="py-2">{material.unit}</td>
                          <td className="py-2">{material.quantity} {material.unit}</td>
                          <td className="py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              max={material.quantity}
                              value={materials[material.id] || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                console.log(`Setting material ${material.id} quantity to ${value}`);
                                handleMaterialChange(material.id.toString(), value);
                              }}
                              className="border rounded p-1 w-20"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 text-sm">
                    <h4 className="font-medium">Vật tư đã chọn:</h4>
                    {Object.keys(materials).length > 0 ? (
                      <ul className="list-disc pl-5 mt-2">
                        {Object.keys(materials).map(materialId => {
                          const material = availableMaterials.find(m => m.id.toString() === materialId);
                          return (
                            <li key={materialId}>
                              {material ? material.name : `Vật tư #${materialId}`}: {materials[materialId]} {material?.unit}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-red-500">Chưa chọn vật tư nào.</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Hiển thị cảnh báo khi cần thiết */}
              {requiresMaterials && Object.keys(materials).length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm mb-4">
                  <p className="font-medium text-yellow-800">
                    Hoạt động {getActivityTypeLabel(formData.activity_type)} cần có ít nhất một vật tư.
                  </p>
                  <p className="text-red-600 mt-1">Vui lòng chọn ít nhất một vật tư với số lượng lớn hơn 0.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-4 mt-4 sticky bottom-0 bg-white py-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Thêm hoạt động"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
