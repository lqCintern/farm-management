import * as turf from "@turf/turf";

// Tính diện tích của đa giác
export const calculatePolygonArea = (
  markers: { lat: number; lng: number }[]
): number => {
  if (markers.length < 3) return 0;

  try {
    const coordinates = markers.map((marker) => [marker.lng, marker.lat]);
    coordinates.push(coordinates[0]); // Đóng đa giác
    const polygon = turf.polygon([coordinates]);
    return turf.area(polygon);
  } catch (err) {
    console.error("Lỗi khi tính diện tích đa giác:", err);
    return 0;
  }
};

// Tối ưu hóa đa giác bằng cách giảm số điểm
export const optimizePolygon = (
  markers: { lat: number; lng: number }[],
  tolerance: number = 0.00005
): { lat: number; lng: number }[] => {
  if (markers.length < 4) return markers;

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

    const simplified = turf.simplify(geoJson as any, { tolerance });
    return (simplified.geometry as any).coordinates[0]
      .map(([lng, lat]: [number, number]) => ({ lat, lng }))
      .slice(0, -1);
  } catch (err) {
    console.error("Lỗi khi tối ưu hóa đa giác:", err);
    return markers;
  }
};
