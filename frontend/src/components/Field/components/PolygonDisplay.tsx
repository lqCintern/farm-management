import React from "react";
import { Marker, Polygon, Tooltip } from "react-leaflet";

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
          draggable={!isDrawing} // CHỈ CHO PHÉP KÉO KHI KHÔNG ĐANG VẼ
          eventHandlers={{
            dragend: (e) => {
              console.log("Marker dragged"); // Debug
              const marker = e.target;
              const position = marker.getLatLng();
              setMarkers((prevMarkers) =>
                prevMarkers.map((m, i) =>
                  i === idx ? { lat: position.lat, lng: position.lng } : m
                )
              );
            },
            contextmenu: () => {
              // Cho phép xóa điểm trong cả hai chế độ
              if (markers.length > 3) {
                // Giữ ít nhất 3 điểm cho polygon
                setMarkers((prevMarkers) =>
                  prevMarkers.filter((_, i) => i !== idx)
                );
              } else {
                alert("Đa giác phải có ít nhất 3 điểm!");
              }
            },
          }}
        >
          <Tooltip permanent>
            {idx === 0 ? "Điểm đầu" : `Điểm ${idx + 1}`}
            {!isDrawing && " (Kéo để di chuyển)"}
          </Tooltip>
        </Marker>
      ))}

      {/* Polygon */}
      {markers.length >= 3 && (
        <Polygon
          positions={markers.map((m) => [m.lat, m.lng])}
          pathOptions={{
            color: isDrawing ? "#3388ff" : "#33a02c",
            fillColor: isDrawing ? "#3388ff" : "#33a02c",
            fillOpacity: 0.2,
            weight: 2,
          }}
        >
          <Tooltip sticky>
            {temporaryArea !== null
              ? `Diện tích: ${temporaryArea.toFixed(2)} m²`
              : "Đang tính diện tích..."}
          </Tooltip>
        </Polygon>
      )}
    </>
  );
};

export default PolygonDisplay;
