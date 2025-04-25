import { useState, useEffect, useCallback } from 'react';
import * as turf from '@turf/turf';
import L from 'leaflet';

interface UseMapDrawingProps {
  onPolygonComplete: (polygonData: { lat: number; lng: number }[], area: number) => void;
}

export const useMapDrawing = ({ onPolygonComplete }: UseMapDrawingProps) => {
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([]);
  const [area, setArea] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [temporaryArea, setTemporaryArea] = useState<number | null>(null);

  // Tính diện tích tạm thời
  useEffect(() => {
    if (isDrawing && markers.length >= 3) {
      try {
        const coordinates = markers.map((marker) => [marker.lng, marker.lat]);
        coordinates.push(coordinates[0]);
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

  // Bắt đầu vẽ
  const startDrawing = useCallback(() => {
    setIsDrawing(true);
    setMarkers([]);
    setArea(null);
  }, []);

  // Hoàn thành vẽ
  const finishDrawing = useCallback(() => {
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
  }, [markers, onPolygonComplete]);

  // Hủy vẽ
  const cancelDrawing = useCallback(() => {
    setMarkers([]);
    setIsDrawing(false);
  }, []);

  // Xóa điểm cuối
  const undoLastPoint = useCallback(() => {
    setMarkers((prevMarkers) => prevMarkers.slice(0, -1));
  }, []);

  // Tối ưu hóa đa giác
  const optimizePolygon = useCallback(() => {
    if (markers.length < 4) return;

    try {
      const geoJson = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[...markers.map(p => [p.lng, p.lat]), [markers[0].lng, markers[0].lat]]],
        },
      };
      
      const simplified = turf.simplify(geoJson as any, {tolerance: 0.00005});
      const optimizedPoints = (simplified.geometry as any).coordinates[0]
        .map(([lng, lat]: [number, number]) => ({lat, lng}))
        .slice(0, -1);
      
      setMarkers(optimizedPoints);
    } catch (err) {
      console.error("Lỗi khi tối ưu hóa đa giác:", err);
    }
  }, [markers]);

  return {
    markers,
    setMarkers,
    isDrawing,
    area,
    temporaryArea,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    undoLastPoint,
    optimizePolygon,
  };
};