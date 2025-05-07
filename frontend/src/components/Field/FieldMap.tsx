import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";

// Icon mặc định cho marker - QUAN TRỌNG!
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import CustomPane from "./components/new/CustomPane";
import CustomStyle from "./components/new/CustomStyle";
import MapControls from "./components/new/MapControls";
import AreaInfo from "./components/new/AreaInfo";

// Thiết lập icon mặc định cho tất cả markers - QUAN TRỌNG!
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Interface
interface FieldMapProps {
  onPolygonComplete: (
    coordinates: { lat: number; lng: number }[],
    area: number
  ) => void;
}

// Component chính
const FieldMap: React.FC<FieldMapProps> = ({ onPolygonComplete }) => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [markers, setMarkers] = useState<{ lat: number; lng: number }[]>([]);
  const [area, setArea] = useState<number>(0);
  const [labelOpacity, setLabelOpacity] = useState<number>(0.7);
  const mapRef = useRef(null);

  // Function để bắt đầu vẽ
  const startDrawing = () => {
    setIsDrawing(true);
    setMarkers([]);
    setArea(0);
  };

  // Function để hoàn thành vẽ
  const finishDrawing = () => {
    if (markers.length < 3) {
      alert("Vui lòng vẽ ít nhất 3 điểm để tạo đa giác.");
      return;
    }

    setIsDrawing(false);

    // Tính diện tích
    calculateArea();
  };

  // Function để hủy vẽ
  const cancelDrawing = () => {
    setIsDrawing(false);
    setMarkers([]);
    setArea(0);
  };

  // Function để tính diện tích polygon
  const calculateArea = () => {
    try {
      if (markers.length < 3) return;

      const polygon = turf.polygon([
        [
          ...markers.map((m) => [m.lng, m.lat]),
          [markers[0].lng, markers[0].lat], // Đóng polygon
        ],
      ]);

      const calculatedArea = turf.area(polygon);
      setArea(calculatedArea);

      // Cập nhật form cha
      onPolygonComplete(markers, calculatedArea);
    } catch (error) {
      console.error("Error calculating area:", error);
    }
  };

  // Effect để tính lại diện tích khi markers thay đổi
  useEffect(() => {
    if (!isDrawing && markers.length >= 3) {
      calculateArea();
    }
  }, [markers, isDrawing]);

  return (
    <div>
      <MapControls
        isDrawing={isDrawing}
        markersCount={markers.length}
        labelOpacity={labelOpacity}
        setLabelOpacity={setLabelOpacity}
        startDrawing={startDrawing}
        finishDrawing={finishDrawing}
        cancelDrawing={cancelDrawing}
        optimizePolygon={() => {
          // Xử lý tối ưu polygon
          console.log("Optimize polygon");
        }}
      />

      <MapContainer
        center={[20.14, 105.848]}
        zoom={15}
        style={{ width: "100%", height: "500px" }}
        ref={mapRef}
      >
        {/* Custom Panes */}
        <CustomPane name="base" zIndex={100} />
        <CustomPane name="overlay" zIndex={400} />
        <CustomPane name="labels" zIndex={650} />

        {/* Map Layers */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Google Satellite" checked>
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="Google"
              pane="base"
              maxZoom={21}
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Hiển thị tên đường và địa điểm" checked>
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

        {/* Drawing Manager & Polygon Display - inline */}
        <DrawingTool
          isDrawing={isDrawing}
          markers={markers}
          setMarkers={setMarkers}
        />

        <CustomStyle />
      </MapContainer>

      <AreaInfo area={area} markers={markers} />
    </div>
  );
};

// Component DrawingTool - kết hợp cả hai chức năng vẽ và hiển thị
// Define the props interface for DrawingTool
interface DrawingToolProps {
  isDrawing: boolean;
  markers: { lat: number; lng: number }[];
  setMarkers: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number }[]>
  >;
}

function DrawingTool({ isDrawing, markers, setMarkers }: DrawingToolProps) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;

      const { lat, lng } = e.latlng;
      setMarkers((prev) => [...prev, { lat, lng }]);
    },
  });

  // Nếu không có đủ markers để vẽ polygon
  if (markers.length < 2) return null;

  // Hàm xử lý khi kéo marker
  const handleMarkerDrag = (index: number, newPos: L.LatLng) => {
    const newMarkers: { lat: number; lng: number }[] = [...markers];
    newMarkers[index] = { lat: newPos.lat, lng: newPos.lng };
    setMarkers(newMarkers);
  };

  // Vẽ polygon
  const polygonPositions = markers.map((marker) => [marker.lat, marker.lng]);

  return (
    <>
      {/* Vẽ polygon */}
      <Polygon
        positions={polygonPositions as L.LatLngExpression[]}
        pathOptions={{
          color: isDrawing ? "blue" : "green",
          fillColor: isDrawing ? "blue" : "green",
          fillOpacity: 0.3,
          weight: 3,
        }}
      />

      {/* Vẽ các markers */}
      {markers.map((marker, index) => (
        <Marker
          key={`marker-${index}`}
          position={[marker.lat, marker.lng]}
          draggable={!isDrawing}
          eventHandlers={{
            dragend: (e) => {
              const newPos = e.target.getLatLng();
              handleMarkerDrag(index, newPos);
            },
          }}
        />
      ))}
    </>
  );
}

// Imports bổ sung cho component DrawingTool
import { Polygon, Marker } from "react-leaflet";

export default FieldMap;
