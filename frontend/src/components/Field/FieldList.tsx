import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Polygon,
  LayersControl,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import fieldService from "@/services/fieldService";
import CustomPane from "./components/CustomPane";
import CustomStyle from "./components/CustomStyle";
import {
  FaPlus,
  FaFilter,
  FaSearch,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
} from "react-icons/fa";

// Hàm thay đổi màu ngẫu nhiên cho các polygon
const getRandomColor = () => {
  const colors = [
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#FF33A8",
    "#33FFF5",
    "#F533FF",
    "#FFD133",
    "#33B4FF",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Component zoom đến polygon khi click
interface FitBoundsToPolygonProps {
  coordinates: { lat: number; lng: number }[];
}

const FitBoundsToPolygon: React.FC<FitBoundsToPolygonProps> = ({
  coordinates,
}) => {
  const map = useMap();

  const fitBounds = () => {
    if (coordinates && coordinates.length > 0) {
      const bounds = coordinates.map((coord): [number, number] => [
        coord.lat,
        coord.lng,
      ]);
      map.fitBounds(bounds);
    }
  };

  return (
    <button
      onClick={fitBounds}
      className="absolute z-10 bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
      title="Zoom to field"
    >
      <FaMapMarkerAlt className="text-blue-600" />
    </button>
  );
};

const FieldList: React.FC = () => {
  const [fields, setFields] = useState<any[]>([]);
  const [filteredFields, setFilteredFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [labelOpacity] = useState<number>(0.8);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fieldService.getFields();
        const fieldsWithColors = response.data.map((field: Field) => ({
          ...field,
          color: getRandomColor(),
        }));
        setFields(fieldsWithColors);
        setFilteredFields(fieldsWithColors);
      } catch (error) {
        console.error("Error fetching fields:", error);
      }
    };

    fetchFields();
  }, []);

  useEffect(() => {
    // Filter and sort fields
    let result = [...fields];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(
        (field) =>
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "area") {
        return b.area - a.area;
      } else if (sortBy === "date") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return 0;
    });

    setFilteredFields(result);
  }, [fields, searchTerm, sortBy]);

  interface Field {
    id: string;
    name: string;
    location: string;
    description?: string;
    area: number;
    coordinates: { lat: number; lng: number }[];
    color: string;
    created_at: string;
  }

  const handleFieldClick = (field: Field): void => {
    setSelectedField(field);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý cánh đồng
          </h1>
          <Link
            to="/fields/new"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> Thêm cánh đồng
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc vị trí..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center border border-blue-200 hover:bg-blue-100"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <FaFilter className="mr-2" /> Lọc & Sắp xếp
              </button>

              {filterOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 p-4">
                  <h3 className="font-medium mb-2 text-gray-700">
                    Sắp xếp theo
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        value="name"
                        checked={sortBy === "name"}
                        onChange={() => setSortBy("name")}
                        className="mr-2"
                      />
                      Tên
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        value="area"
                        checked={sortBy === "area"}
                        onChange={() => setSortBy("area")}
                        className="mr-2"
                      />
                      Diện tích (giảm dần)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sortBy"
                        value="date"
                        checked={sortBy === "date"}
                        onChange={() => setSortBy("date")}
                        className="mr-2"
                      />
                      Ngày tạo (mới nhất)
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Map and Field List */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map Section */}
          <div className="lg:w-2/3 bg-white rounded-lg shadow-sm p-4 relative">
            <div className="h-[600px]">
              <MapContainer
                center={[20.14, 105.848]}
                zoom={17}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "0.5rem",
                }}
                ref={mapRef}
              >
                {/* Custom Panes */}
                <CustomPane name="base" zIndex={100} />
                <CustomPane name="overlay" zIndex={400} />
                <CustomPane name="labels" zIndex={650} />

                {/* Map Layers */}
                <LayersControl position="topright">
                  {/* Ảnh vệ tinh Google (zoom cận) */}
                  <LayersControl.BaseLayer name="Google Satellite" checked>
                    <TileLayer
                      url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                      attribution="Google"
                      pane="base"
                      maxZoom={21}
                    />
                  </LayersControl.BaseLayer>

                  {/* Overlay Layers */}
                  <LayersControl.Overlay name="Hiển thị tên đường và địa điểm">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      pane="labels"
                      opacity={labelOpacity}
                      className="label-layer"
                    />
                  </LayersControl.Overlay>

                  <LayersControl.Overlay name="Tên xã/huyện/tỉnh">
                    <TileLayer
                      url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-labels/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://stamen.com">Stamen Design</a>'
                      pane="labels"
                      opacity={labelOpacity * 0.8}
                    />
                  </LayersControl.Overlay>
                </LayersControl>

                {/* Hiển thị các đa giác */}
                {filteredFields.map((field) => (
                  <Polygon
                    key={field.id}
                    positions={field.coordinates.map((coord: any) => [
                      coord.lat,
                      coord.lng,
                    ])}
                    pathOptions={{
                      color: field.color,
                      fillColor: field.color,
                      fillOpacity:
                        selectedField && selectedField.id === field.id
                          ? 0.7
                          : 0.4,
                      weight:
                        selectedField && selectedField.id === field.id ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleFieldClick(field),
                    }}
                  >
                    <Tooltip sticky>
                      <div>
                        <strong>{field.name}</strong>
                        <div>{field.area.toLocaleString()} m²</div>
                      </div>
                    </Tooltip>
                    <Popup>
                      <div className="min-w-[200px]">
                        <h3 className="font-bold text-lg mb-1">{field.name}</h3>
                        <p className="text-gray-600 mb-2">{field.location}</p>
                        <p className="mb-2">{field.description}</p>
                        <div className="flex items-center mb-2">
                          <span className="font-medium">Diện tích:</span>
                          <span className="ml-2">
                            {field.area.toLocaleString()} m²
                          </span>
                        </div>
                        <div className="flex justify-between mt-3">
                          <Link
                            to={`/fields/${field.id}`}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Chi tiết
                          </Link>
                          <Link
                            to={`/fields/${field.id}/edit`}
                            className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 text-sm"
                          >
                            Chỉnh sửa
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                ))}

                {/* Zoom to selected field */}
                {selectedField && (
                  <FitBoundsToPolygon coordinates={selectedField.coordinates} />
                )}

                {/* Custom CSS filter */}
                <CustomStyle />
              </MapContainer>
            </div>
          </div>

          {/* Fields List */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">
                  Danh sách cánh đồng ({filteredFields.length})
                </h2>
              </div>
              <div className="overflow-y-auto max-h-[550px] p-2">
                {filteredFields.length > 0 ? (
                  <div className="space-y-3">
                    {filteredFields.map((field) => (
                      <div
                        key={field.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                          selectedField && selectedField.id === field.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => handleFieldClick(field)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {field.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {field.location}
                            </p>
                            <div className="mt-2 flex items-center">
                              <span
                                className="block w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: field.color }}
                              />
                              <span className="text-sm text-gray-700">
                                {field.area.toLocaleString()} m²
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Link
                              to={`/fields/${field.id}/edit`}
                              className="p-1.5 text-gray-500 hover:text-amber-500 hover:bg-amber-50 rounded"
                              title="Chỉnh sửa"
                            >
                              <FaEdit size={16} />
                            </Link>
                            <button
                              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                              title="Xóa"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                        {field.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <p>Không tìm thấy cánh đồng nào phù hợp</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldList;
