import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as turf from "@turf/turf";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Import các component con
import CustomPane from "./components/CustomPane";
import CustomStyle from "./components/CustomStyle";
import DrawingManager from "./components/DrawingManager";
import PolygonDisplay from "./components/PolygonDisplay";
import MapControls from "./components/MapControls";
import AreaInfo from "./components/AreaInfo";
import GoogleMapView from "./components/GoogleMap";
import { calculatePolygonArea, optimizePolygon } from "./utils/polygonUtils";

// Thiết lập icon mặc định cho Marker
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  const [labelOpacity, setLabelOpacity] = useState<number>(0.8);
  const [showGoogleMap, setShowGoogleMap] = useState(false);

  // Tính diện tích tạm thời khi có ít nhất 3 điểm
  useEffect(() => {
    if (isDrawing && markers.length >= 3) {
      try {
        const calculatedArea = calculatePolygonArea(markers);
        setTemporaryArea(calculatedArea);
      } catch (err) {
        console.error("Lỗi khi tính diện tích tạm thời:", err);
        setTemporaryArea(null);
      }
    } else {
      setTemporaryArea(null);
    }
  }, [markers, isDrawing]);

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
      const calculatedArea = calculatePolygonArea(markers);
      onPolygonComplete(markers, calculatedArea);
      setArea(calculatedArea);
      setIsDrawing(false);
      setShowGoogleMap(true); // Hiển thị Google Maps sau khi hoàn thành
    } catch (err) {
      console.error("Lỗi khi tạo polygon:", err);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setMarkers([]);
  };

  const handleOptimizePolygon = () => {
    if (markers.length < 4) return;
    const optimized = optimizePolygon(markers);
    setMarkers(optimized);
  };

  const handlePolygonComplete = (
    polygonData: { lat: number; lng: number }[],
    calculatedArea: number
  ) => {
    onPolygonComplete(polygonData, calculatedArea);
    setArea(calculatedArea);
    setMarkers(polygonData);
  };

  return (
    <div>
      {/* Controls */}
      <MapControls
        isDrawing={isDrawing}
        markersCount={markers.length}
        labelOpacity={labelOpacity}
        setLabelOpacity={setLabelOpacity}
        startDrawing={startDrawing}
        finishDrawing={finishDrawing}
        cancelDrawing={cancelDrawing}
        optimizePolygon={handleOptimizePolygon}
      />

      {/* Map */}
      <MapContainer
        center={[20.14, 105.848]}
        zoom={15}
        style={{ width: "100%", height: "500px" }}
      >
        {/* Custom Panes */}
        <CustomPane name="base" zIndex={100} />
        <CustomPane name="overlay" zIndex={400} />
        <CustomPane name="labels" zIndex={650} />

        {/* Map Layers */}
        <LayersControl position="topright">
          {/* Ảnh vệ tinh ESRI (mặc định)
          <LayersControl.BaseLayer name="ESRI Satellite" checked>
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
              pane="base"
              maxNativeZoom={18}
              maxZoom={21}
            />
          </LayersControl.BaseLayer> */}

          {/* Ảnh vệ tinh Google (zoom cận) */}
          <LayersControl.BaseLayer name="Google Satellite" checked>
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="Google"
              pane="base"
              maxZoom={21}
            />
          </LayersControl.BaseLayer>

          {/* OpenStreetMap */}
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              pane="base"
            />
          </LayersControl.BaseLayer>

          {/* Overlay Layers */}
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

        {/* Custom CSS filter */}
        <CustomStyle />

        {/* Drawing Manager */}
        <DrawingManager
          isDrawing={isDrawing}
          markers={markers}
          setMarkers={setMarkers}
          setIsDrawing={setIsDrawing}
          onPolygonComplete={handlePolygonComplete}
        />

        {/* Polygon Display */}
        <PolygonDisplay
          markers={markers}
          isDrawing={isDrawing}
          temporaryArea={temporaryArea}
          setMarkers={setMarkers}
        />
      </MapContainer>

      {/* Area Information */}
      <AreaInfo area={area} markers={markers} />
      {/* Google Maps View */}
      <GoogleMapView markers={markers} showMap={showGoogleMap} />
    </div>
  );
};

export default FieldMap;
