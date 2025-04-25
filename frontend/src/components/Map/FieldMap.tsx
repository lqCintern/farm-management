import React, { useRef, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Polygon,
  Popup,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const CustomPane = ({ name, zIndex }: { name: string; zIndex: number }) => {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane(name)) {
      map.createPane(name);
      map.getPane(name)!.style.zIndex = zIndex.toString();
    }
    return () => {
    };
  }, [map, name, zIndex]);

  return null;
};

interface FieldMapProps {
  onPolygonComplete: (
    polygonData: { lat: number; lng: number }[],
    area: number
  ) => void;
}

const FieldMap: React.FC<FieldMapProps> = ({ onPolygonComplete }) => {
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([]);
  const [area, setArea] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [temporaryArea, setTemporaryArea] = useState<number | null>(null);
  const [labelOpacity, setLabelOpacity] = useState<number>(0.8); // Giá trị mặc định cao hơn để nhìn rõ nhãn
  const [baseMapType, setBaseMapType] = useState<string>("satellite"); // Loại bản đồ nền: satellite hoặc osm

  // Tính diện tích tạm thời khi có ít nhất 3 điểm
  useEffect(() => {
    if (isDrawing && markers.length >= 3) {
      try {
        const coordinates = markers.map((marker) => [marker.lng, marker.lat]);
        coordinates.push(coordinates[0]); // Đóng đa giác
        const polygon = turf.polygon([coordinates]);
        setTemporaryArea(turf.area(polygon));
      } catch (err) {
        console.error("Lỗi khi tính diện tích tạm thời:", err);
        setTemporaryArea(null);
      }
    } else {
      setTemporaryArea(null);
    }
  }, [markers, isDrawing]);

  const CustomMapWithDraw = () => {
    const map = useMap();

    useEffect(() => {
      // Xử lý sự kiện nhấp vào bản đồ
      const handleMapClick = (e: any) => {
        if (isDrawing) {
          const newMarker = { lat: e.latlng.lat, lng: e.latlng.lng };
          setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
        }
      };

      // Xử lý sự kiện nhấn phím
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && isDrawing && markers.length >= 3) {
          completePolygon();
        } else if (e.key === "Escape") {
          cancelDrawing();
        } else if (e.key === "z" && e.ctrlKey) {
          // Ctrl+Z để xóa điểm cuối cùng
          undoLastPoint();
        }
      };

      // Hoàn thành đa giác
      const completePolygon = () => {
        if (markers.length < 3) {
          alert("Vui lòng chọn ít nhất 3 điểm để tạo đa giác.");
          return;
        }

        try {
          // Đóng đa giác bằng cách thêm điểm đầu tiên vào cuối
          const coordinates = markers.map((marker) => [marker.lng, marker.lat]);
          coordinates.push(coordinates[0]);

          const polygon = turf.polygon([coordinates]);
          const calculatedArea = turf.area(polygon);

          // Hiển thị diện tích trên bản đồ
          const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
          const center = bounds.getCenter();

          L.popup()
            .setLatLng(center)
            .setContent(`Diện tích: ${calculatedArea.toFixed(2)} m²`)
            .openOn(map);

          // Gửi dữ liệu về parent component
          onPolygonComplete(markers, calculatedArea);

          // Lưu diện tích vào state
          setArea(calculatedArea);
          setIsDrawing(false);
        } catch (err) {
          console.error("Lỗi khi tạo polygon:", err);
        }
      };

      // Hủy vẽ đa giác
      const cancelDrawing = () => {
        setMarkers([]);
        setIsDrawing(false);
      };

      // Xóa điểm cuối cùng
      const undoLastPoint = () => {
        setMarkers((prevMarkers) => prevMarkers.slice(0, -1));
      };

      map.on("click", handleMapClick);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        map.off("click", handleMapClick);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [map, markers, isDrawing]);

    return null;
  };

  // Các hàm xử lý vẽ đa giác (startDrawing, finishDrawing, optimizePolygon) giữ nguyên...
  const startDrawing = () => {
    setIsDrawing(true);
    setMarkers([]);
    setArea(null);
  };

  const finishDrawing = () => {
    if (markers.length < 3) {
      alert("Vui lòng chọn ít nhất 3 điểm để tạo đa giác.");
      return;
    }

    try {
      const coordinates = markers.map((marker) => [marker.lng, marker.lat]);
      coordinates.push(coordinates[0]);

      const polygon = turf.polygon([coordinates]);
      const calculatedArea = turf.area(polygon);

      onPolygonComplete(markers, calculatedArea);
      setArea(calculatedArea);
      setIsDrawing(false);
    } catch (err) {
      console.error("Lỗi khi tạo polygon:", err);
    }
  };

  const optimizePolygon = () => {
    if (markers.length < 4) return;

    try {
      const geoJson = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              ...markers.map((p) => [p.lng, p.lat]),
              [markers[0].lng, markers[0].lat],
            ],
          ],
        },
      };

      const simplified = turf.simplify(geoJson as any, { tolerance: 0.00005 });
      const optimizedPoints = (simplified.geometry as any).coordinates[0]
        .map(([lng, lat]: [number, number]) => ({ lat, lng }))
        .slice(0, -1);

      setMarkers(optimizedPoints);
    } catch (err) {
      console.error("Lỗi khi tối ưu hóa đa giác:", err);
    }
  };

  return (
    <div>
      <div className="buttons" style={{ marginBottom: "10px" }}>
        {!isDrawing ? (
          <button onClick={startDrawing} className="btn btn-primary">
            Bắt đầu vẽ đa giác
          </button>
        ) : (
          <>
            <button
              onClick={finishDrawing}
              disabled={markers.length < 3}
              className="btn btn-success"
            >
              Hoàn thành đa giác
            </button>
            <button
              onClick={() => setIsDrawing(false)}
              className="btn btn-danger"
            >
              Hủy
            </button>
            <button
              onClick={optimizePolygon}
              disabled={markers.length < 4}
              title="Giảm số điểm của đa giác"
              style={{ marginLeft: "10px" }}
              className="btn"
            >
              Tối ưu điểm
            </button>
          </>
        )}

        <div style={{ marginTop: "10px" }}>
          <label>
            Độ hiển thị tên địa điểm:
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={labelOpacity}
              onChange={(e) => setLabelOpacity(parseFloat(e.target.value))}
              style={{ marginLeft: "10px", verticalAlign: "middle" }}
            />
          </label>
        </div>
      </div>

      <MapContainer
        center={[20.14, 105.848]}
        zoom={15}
        style={{ width: "100%", height: "500px" }}
      >
        {/* Tạo các custom panes */}
        <CustomPane name="base" zIndex={100} />
        <CustomPane name="overlay" zIndex={400} />
        <CustomPane name="labels" zIndex={650} />

        {/* Control chọn lớp bản đồ */}
        <LayersControl position="topright">
          {/* Lớp ảnh vệ tinh ESRI */}
          <LayersControl.BaseLayer name="Ảnh vệ tinh" checked>
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
              pane="base"
            />
          </LayersControl.BaseLayer>

          {/* Lớp OpenStreetMap tiêu chuẩn */}
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              pane="base"
            />
          </LayersControl.BaseLayer>

          {/* Overlay labels - lớp nhãn đường và tên địa điểm */}
          <LayersControl.Overlay name="Hiển thị tên đường và địa điểm" checked>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              pane="labels"
              opacity={labelOpacity}
              className="label-layer" // Thêm class để áp dụng CSS
            />
          </LayersControl.Overlay>

          {/* Overlay thêm thông tin hành chính */}
          <LayersControl.Overlay name="Tên xã/huyện/tỉnh">
            <TileLayer
              url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-labels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://stamen.com">Stamen Design</a>'
              pane="labels"
              opacity={labelOpacity * 0.8}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* CSS filter để chỉ hiển thị nhãn từ OpenStreetMap */}
        <CustomStyle />

        <CustomMapWithDraw />

        {/* Hiển thị các điểm đánh dấu và đa giác (phần còn lại không thay đổi) */}
        {markers.map((position, idx) => (
          <Marker
            key={`marker-${idx}`}
            position={[position.lat, position.lng]}
            draggable={isDrawing}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setMarkers((prevMarkers) =>
                  prevMarkers.map((m, i) =>
                    i === idx ? { lat: position.lat, lng: position.lng } : m
                  )
                );
              },
              contextmenu: () => {
                if (isDrawing) {
                  setMarkers((prevMarkers) =>
                    prevMarkers.filter((_, i) => i !== idx)
                  );
                }
              },
            }}
          >
            <Tooltip permanent>Điểm {idx + 1}</Tooltip>
          </Marker>
        ))}

        {markers.length >= 3 && (
          <Polygon
            positions={markers.map((m) => [m.lat, m.lng])}
            pathOptions={{
              color: "#3388ff",
              fillColor: "#3388ff",
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Tooltip sticky>
              {temporaryArea !== null
                ? `Diện tích tạm thời: ${temporaryArea.toFixed(2)} m²`
                : "Đang tính diện tích..."}
            </Tooltip>
          </Polygon>
        )}
      </MapContainer>

      {area !== null && (
        <div
          className="area-display"
          style={{
            marginTop: "15px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h4>Thông tin đa giác</h4>
          <p>
            <strong>Diện tích:</strong> {area.toFixed(2)} m²
          </p>
          <details>
            <summary>Xem tọa độ chi tiết</summary>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    STT
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    Vĩ độ (Lat)
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    Kinh độ (Lng)
                  </th>
                </tr>
              </thead>
              <tbody>
                {markers.map((coord, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {index + 1}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {coord.lat.toFixed(6)}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {coord.lng.toFixed(6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}
    </div>
  );
};

// Component thêm CSS để hiển thị chỉ text từ OpenStreetMap
const CustomStyle = () => {
  const map = useMap();

  useEffect(() => {
    // Tạo thẻ style để chỉ hiển thị text từ OSM
    const style = document.createElement("style");
    style.textContent = `
      .label-layer {
        filter: grayscale(100%) brightness(40%) invert(100%);
        -webkit-filter: grayscale(100%) brightness(40%) invert(100%);
        mix-blend-mode: screen;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default FieldMap;
