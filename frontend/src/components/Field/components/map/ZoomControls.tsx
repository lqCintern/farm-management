import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { FaMapMarkerAlt } from "react-icons/fa";

// Component zoom đến polygon khi click
interface FitBoundsToPolygonProps {
  coordinates: { lat: number; lng: number }[];
}

export const FitBoundsToPolygon: React.FC<FitBoundsToPolygonProps> = ({
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

interface AutoFitToSelectedFieldProps {
  field: any | null;
}

export const AutoFitToSelectedField: React.FC<AutoFitToSelectedFieldProps> = ({
  field,
}) => {
  const map = useMap();

  useEffect(() => {
    if (field && field.coordinates && field.coordinates.length > 0) {
      try {
        const latLngs = field.coordinates.map(
          (coord: { lat: number; lng: number }) => [coord.lat, coord.lng]
        );

        const bounds = L.latLngBounds(latLngs);

        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 18,
          animate: true,
          duration: 0.5,
        });
      } catch (error) {
        console.error("Error fitting bounds to selected field:", error);
      }
    }
  }, [field, map]);

  return null;
};
