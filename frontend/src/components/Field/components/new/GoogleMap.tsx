import React, { useMemo } from "react";

interface GoogleMapViewProps {
  markers: { lat: number; lng: number }[];
  showMap: boolean;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ markers, showMap }) => {
  // Chỉ tính toán lại khi markers thay đổi
  const mapInfo = useMemo(() => {
    if (!markers || markers.length < 3) return null;

    // Tính toán tọa độ trung tâm của đa giác
    const centerLat =
      markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length;
    const centerLng =
      markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length;

    return {
      center: { lat: centerLat, lng: centerLng },
      url: `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${centerLng}!3d${centerLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1svi!2s!4v1620000000000!5m2!1svi!2s`,
      directUrl: `https://www.google.com/maps/@${centerLat},${centerLng},18z/data=!3m1!1e3`,
    };
  }, [markers]);

  if (!showMap || !mapInfo) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-lg font-medium">Xem trên Google Maps:</h4>
        <a
          href={mapInfo.directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Mở trong Google Maps
        </a>
      </div>
      <div className="border rounded-lg overflow-hidden relative pt-[56.25%]">
        {" "}
        {/* 16:9 Aspect Ratio */}
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={mapInfo.url}
          frameBorder="0"
          allowFullScreen
          aria-hidden="false"
          tabIndex={0}
          loading="lazy"
          title="Google Maps View"
        ></iframe>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        <p>
          <strong>Lưu ý:</strong> Google Maps không thể hiển thị chính xác đa
          giác đã vẽ. Bạn có thể nhấp vào liên kết "Mở trong Google Maps" để xem
          vị trí chi tiết hơn.
        </p>
      </div>
    </div>
  );
};

export default GoogleMapView;
