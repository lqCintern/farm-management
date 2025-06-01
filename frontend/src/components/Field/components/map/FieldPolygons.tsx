import React from "react";
import { Polygon, Tooltip, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { Field } from "@/components/Field/types";
import { PineappleCrop } from "@/types/labor/types"; // Import PineappleCrop interface

interface FieldPolygonsProps {
  fields: Field[];
  selectedField: Field | null;
  onFieldClick: (field: Field) => void;
}

const FieldPolygons: React.FC<FieldPolygonsProps> = ({
  fields,
  selectedField,
  onFieldClick,
}) => {
  return (
    <>
      {fields.map((field) => {
        // Lấy mùa vụ hiện tại từ mảng currentCrop
        const currentCrop: PineappleCrop | undefined = Array.isArray(field.currentCrop)
          ? field.currentCrop.find((crop) => crop.status === "harvesting") || field.currentCrop[0]
          : undefined;
          
        // Kiểm tra xem field.coordinates có phải là mảng không
        if (!field.coordinates || !Array.isArray(field.coordinates)) {
          console.error(`Field ${field.id} (${field.name}) có coordinates không hợp lệ:`, field.coordinates);
          return null; // Bỏ qua field này nếu không có coordinates hợp lệ
        }

        return (
          <Polygon
            key={field.id}
            positions={field.coordinates.map((coord) => [coord.lat, coord.lng])}
            pathOptions={{
              color: field.color,
              fillColor: field.color,
              fillOpacity:
                selectedField && selectedField.id === field.id ? 0.7 : 0.4,
              weight: selectedField && selectedField.id === field.id ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onFieldClick(field),
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
                  <span className="ml-2">{field.area.toLocaleString()} m²</span>
                </div>
                <div className="mb-2">
                  <p className="font-medium">Mùa vụ:</p>
                  <p className="text-gray-600">
                    {currentCrop?.name || "Chưa có thông tin"} ({currentCrop?.variety || "Không xác định"})
                  </p>
                  <p className="text-gray-600">
                    Thu hoạch: {currentCrop?.harvest_date || "Chưa xác định"}
                  </p>
                  <p className="text-gray-600">
                    Trạng thái: {currentCrop?.current_stage || "Không xác định"} -{" "}
                    {currentCrop?.status || "Không xác định"}
                  </p>
                </div>
                <div className="flex justify-between mt-3">
                  <Link
                    to={`/pineapple/${currentCrop?.id}`}
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
                  <Link
                    to={`/products/create?fieldId=${field.id}&cropId=${currentCrop?.id}`}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                  >
                    Đăng sản phẩm
                  </Link>
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};

export default FieldPolygons;
