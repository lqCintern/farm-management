import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import * as turf from "@turf/turf";
import { calculatePolygonArea } from "../utils/polygonUtils";

interface DrawingManagerProps {
  isDrawing: boolean;
  markers: { lat: number; lng: number }[];
  setMarkers: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number }[]>
  >;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
  onPolygonComplete: (
    polygonData: { lat: number; lng: number }[],
    area: number
  ) => void;
}

const DrawingManager: React.FC<DrawingManagerProps> = ({
  isDrawing,
  markers,
  setMarkers,
  setIsDrawing,
  onPolygonComplete,
}) => {
  const map = useMap();

  useEffect(() => {
    // Xử lý sự kiện nhấp vào bản đồ
    const handleMapClick = (e: L.LeafletMouseEvent) => {
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
        const calculatedArea = calculatePolygonArea(markers);

        // Hiển thị diện tích trên bản đồ
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
        const center = bounds.getCenter();

        L.popup()
          .setLatLng(center)
          .setContent(
            `Diện tích: ${calculatedArea ? calculatedArea.toFixed(2) : 0} m²`
          )
          .openOn(map);

        // Gửi dữ liệu về parent component
        if (calculatedArea !== null) {
          onPolygonComplete(markers, calculatedArea);
        } else {
          console.error("Calculated area is null. Cannot complete polygon.");
        }

        // Đặt lại trạng thái vẽ
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

    // Đăng ký sự kiện
    map.on("click", handleMapClick);
    document.addEventListener("keydown", handleKeyDown);

    // Hủy đăng ký sự kiện khi component unmount
    return () => {
      map.off("click", handleMapClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, markers, isDrawing, setMarkers, setIsDrawing, onPolygonComplete]);

  return null;
};

export default DrawingManager;
