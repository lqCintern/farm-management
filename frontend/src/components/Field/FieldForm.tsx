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
import fieldService from "@/services/farming/fieldService";
import * as turf from "@turf/turf";

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
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCoords, setManualCoords] = useState<{ lat: string; lng: string }[]>([]);
  const [manualInputError, setManualInputError] = useState("");

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
          setArea(Number(field.area) || 0);
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

  // Thêm/xóa/sửa điểm nhập tọa độ
  const handleAddManualCoord = () => {
    setManualCoords((prev) => [...prev, { lat: "", lng: "" }]);
  };
  const handleRemoveManualCoord = (idx: number) => {
    setManualCoords((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleChangeManualCoord = (idx: number, key: "lat" | "lng", value: string) => {
    setManualCoords((prev) => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c));
  };
  const handleManualInput = () => {
    setManualInputError("");
    const coords: { lat: number; lng: number }[] = [];
    for (const { lat, lng } of manualCoords) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || isNaN(lngNum)) {
        setManualInputError("Tất cả vĩ độ và kinh độ phải là số hợp lệ.");
        return;
      }
      coords.push({ lat: latNum, lng: lngNum });
    }
    if (coords.length < 3) {
      setManualInputError("Cần ít nhất 3 điểm để tạo đa giác.");
      return;
    }
    try {
      const polygon = turf.polygon([
        [...coords.map((c) => [c.lng, c.lat]), [coords[0].lng, coords[0].lat]],
      ]);
      const calculatedArea = turf.area(polygon);
      setCoordinates(coords);
      setArea(calculatedArea);
      setManualInputError("");
    } catch (e) {
      setManualInputError("Không thể tính diện tích. Kiểm tra lại tọa độ.");
    }
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg text-center card-hover border border-green-100">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6 pulse-glow"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Đang tải dữ liệu cánh đồng...</h3>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="mb-8 flex items-center">
            <button
              onClick={() => navigate("/fields")}
              className="text-gray-600 hover:text-green-600 mr-4 flex items-center transition-all duration-200 hover:scale-105 group"
            >
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              <span>Quay lại</span>
            </button>
            <h1 className="text-3xl font-bold gradient-text">
              {isEditMode ? "Chỉnh sửa cánh đồng" : "Tạo cánh đồng mới"}
            </h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg animate-pulse">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Form inputs */}
                <div className="p-6 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                  <div className="space-y-6">
                    <div className="form-section form-input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-200"></span>
                          Tên cánh đồng <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 search-input"
                        placeholder="Nhập tên cánh đồng"
                        required
                      />
                    </div>

                    <div className="form-section form-input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-200"></span>
                          Vị trí
                        </span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 search-input"
                        placeholder="Nhập vị trí cánh đồng"
                      />
                    </div>

                    <div className="form-section form-input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-200"></span>
                          Mô tả
                        </span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-300 min-h-[120px] resize-none"
                        placeholder="Mô tả chi tiết về cánh đồng"
                      />
                    </div>

                    <div className="form-section form-input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-200"></span>
                          Diện tích
                        </span>
                      </label>
                      <div className="flex items-center">
                        <FaRuler className="text-orange-500 mr-2 floating-icon" />
                        <input
                          type="text"
                          value={area.toLocaleString()}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 text-gray-700 font-medium area-display"
                        />
                        <span className="ml-2 text-gray-600 font-medium">m²</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                        Diện tích được tính tự động khi bạn vẽ khu vực trên bản đồ
                      </p>
                    </div>

                    <div className="form-section form-input-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2 group">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 group-hover:scale-125 transition-transform duration-200"></span>
                          Nhập tọa độ thủ công
                        </span>
                      </label>
                      <div className="flex flex-col gap-3">
                        {manualCoords.map((coord, idx) => (
                          <div key={idx} className="flex gap-2 items-center group/coord">
                            <input
                              type="number"
                              step="any"
                              className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300 coordinate-input"
                              placeholder="Vĩ độ"
                              value={coord.lat}
                              onChange={e => handleChangeManualCoord(idx, "lat", e.target.value)}
                            />
                            <span className="text-gray-500 font-medium">,</span>
                            <input
                              type="number"
                              step="any"
                              className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300 coordinate-input"
                              placeholder="Kinh độ"
                              value={coord.lng}
                              onChange={e => handleChangeManualCoord(idx, "lng", e.target.value)}
                            />
                            <button
                              type="button"
                              className="ml-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs transition-all duration-200 hover:scale-105 action-btn"
                              onClick={() => handleRemoveManualCoord(idx)}
                              tabIndex={-1}
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                        <div className="button-group">
                          <button
                            type="button"
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm transition-all duration-200 hover:scale-105 action-btn"
                            onClick={handleAddManualCoord}
                          >
                            Thêm điểm
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-all duration-200 hover:scale-105 action-btn disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleManualInput}
                            disabled={manualCoords.length < 3}
                          >
                            Vẽ đa giác
                          </button>
                        </div>
                        {manualInputError && (
                          <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded-lg border border-red-200 animate-pulse">
                            {manualInputError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column - Map */}
                <div className="lg:col-span-2 relative">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md px-4 py-3 border border-blue-200">
                      <FaMapMarkedAlt className="text-blue-500 mr-2 floating-icon" />
                      <span className="font-medium text-gray-700">
                        {isEditMode ? "Chỉnh sửa khu vực" : "Vẽ khu vực cánh đồng"}
                      </span>
                    </div>
                    <div className="map-container">
                      <FieldMap onPolygonComplete={handlePolygonComplete} coordinates={coordinates} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with action buttons */}
              <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-green-50 border-t border-gray-200 flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-green-700">Quy trình:</span>
                    <span className="flex items-center process-step">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 process-step-number">1</span>
                      Vẽ đa giác trên bản đồ
                    </span>
                    <span className="text-green-500">→</span>
                    <span className="flex items-center process-step">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 process-step-number">2</span>
                      Điều chỉnh vị trí các điểm
                    </span>
                    <span className="text-blue-500">→</span>
                    <span className="flex items-center process-step">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 process-step-number">3</span>
                      Nhập thông tin và lưu
                    </span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/fields")}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 flex items-center hover:bg-gray-100 transition-all duration-200 hover:scale-105 action-btn"
                  >
                    <FaTimes className="mr-2" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || coordinates.length < 3}
                    className={`px-8 py-3 rounded-lg text-white flex items-center transition-all duration-200 hover:scale-105 action-btn ${
                      loading || coordinates.length < 3
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
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
