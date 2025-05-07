import React from "react";
import { LayersControl, TileLayer } from "react-leaflet";

interface CustomMapLayersProps {
  labelOpacity: number;
}

// Define the component
const CustomMapLayers: React.FC<CustomMapLayersProps> = ({ labelOpacity }) => {
  return (
    <LayersControl position="topright">
      {/* Ảnh vệ tinh Google (zoom cận) */}
      <LayersControl.BaseLayer name="Google Satellite" checked>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution="Google"
          pane="base"
          maxZoom={21}
        />
      </LayersControl.BaseLayer>

      {/* Overlay Layers */}
      <LayersControl.Overlay name="Hiển thị tên đường và địa điểm">
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
  );
};

// Explicitly define the default export
export default CustomMapLayers;
