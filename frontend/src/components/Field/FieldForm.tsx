import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaSave,
  FaTimes,
  FaRuler,
  FaMapMarkedAlt,
  FaArrowLeft,
} from "react-icons/fa";
import FieldMap from "@/components/Field/FieldMap";
import fieldService from "@/services/fieldService";

const FieldForm: React.FC = () => {
  const { id } = useParams(); // Get field ID from URL if in edit mode
  const isEditMode = !!id;

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [area, setArea] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Fetch field data if in edit mode
  useEffect(() => {
    const fetchFieldData = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const response = await fieldService.getFieldById(Number(id));
          const field = response.data;

          setName(field.name);
          setDescription(field.description || "");
          setLocation(field.location || "");
          setCoordinates(field.coordinates || []);
          setArea(field.area || 0);
        } catch (error) {
          console.error("Error fetching field data:", error);
          setError("Không thể tải dữ liệu cánh đồng. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFieldData();
  }, [id, isEditMode]);

  const handlePolygonComplete = (
    polygonData: { lat: number; lng: number }[],
    calculatedArea: number
  ) => {
    setCoordinates(polygonData);
    setArea(calculatedArea);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (coordinates.length < 3) {
      setError(
        "Vui lòng vẽ một đa giác trên bản đồ để chọn khu vực cánh đồng."
      );
      return;
    }

    if (!name.trim()) {
      setError("Vui lòng nhập tên cánh đồng.");
      return;
    }

    const data = {
      name,
      description,
      location,
      coordinates,
      area,
    };

    try {
      setLoading(true);

      if (isEditMode) {
        await fieldService.updateField(Number(id), data);
      } else {
        await fieldService.createField(data);
      }

      navigate("/fields");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} field:`,
        error
      );
      setError(
        `Không thể ${
          isEditMode ? "cập nhật" : "tạo"
        } cánh đồng. Vui lòng thử lại.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu cánh đồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6 flex items-center">
            <button
              onClick={() => navigate("/fields")}
              className="text-gray-600 hover:text-gray-900 mr-4 flex items-center"
            >
              <FaArrowLeft className="mr-2" />
              <span>Quay lại</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? "Chỉnh sửa cánh đồng" : "Tạo cánh đồng mới"}
            </h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Form inputs */}
                <div className="p-6 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-200">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên cánh đồng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tên cánh đồng"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vị trí
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập vị trí cánh đồng"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                        placeholder="Mô tả chi tiết về cánh đồng"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diện tích
                      </label>
                      <div className="flex items-center">
                        <FaRuler className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          value={area.toLocaleString()}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                        <span className="ml-2 text-gray-600">m²</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Diện tích được tính tự động khi bạn vẽ khu vực trên bản
                        đồ
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right column - Map */}
                <div className="lg:col-span-2 relative">
                  <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md px-3 py-2">
                    <div className="flex items-center">
                      <FaMapMarkedAlt className="text-blue-500 mr-2" />
                      <span className="font-medium text-gray-700">
                        {isEditMode
                          ? "Chỉnh sửa khu vực"
                          : "Vẽ khu vực cánh đồng"}
                      </span>
                    </div>
                  </div>
                  <FieldMap onPolygonComplete={handlePolygonComplete} />
                </div>
              </div>

              {/* Footer with action buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Quy trình:</span>
                    <span className="ml-2">1. Vẽ đa giác trên bản đồ</span>
                    <span className="mx-2">→</span>
                    <span>2. Điều chỉnh vị trí các điểm nếu cần</span>
                    <span className="mx-2">→</span>
                    <span>3. Nhập thông tin và lưu cánh đồng</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/fields")}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 flex items-center hover:bg-gray-100"
                  >
                    <FaTimes className="mr-2" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || coordinates.length < 3}
                    className={`px-6 py-2 rounded-lg text-white flex items-center ${
                      loading || coordinates.length < 3
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        {isEditMode ? "Lưu thay đổi" : "Lưu cánh đồng"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldForm;
