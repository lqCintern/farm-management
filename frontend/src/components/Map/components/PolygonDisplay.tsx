import React from "react";
import { Marker, Polygon, Tooltip } from "react-leaflet";
import L from "leaflet";

interface AreaDisplayProps {
  area: number | null;
  markers: { lat: number; lng: number }[];
}

const AreaDisplay: React.FC<AreaDisplayProps> = ({ area, markers }) => {
  if (area === null) return null;

  return (
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
  );
};

interface PolygonDisplayProps {
  markers: { lat: number; lng: number }[];
  isDrawing: boolean;
  temporaryArea: number | null;
  setMarkers: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number }[]>
  >;
}

const PolygonDisplay: React.FC<PolygonDisplayProps> = ({
  markers,
  isDrawing,
  temporaryArea,
  setMarkers,
}) => {
  return (
    <>
      {/* Markers */}
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

      {/* Polygon */}
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
    </>
  );
};

export default PolygonDisplay;
