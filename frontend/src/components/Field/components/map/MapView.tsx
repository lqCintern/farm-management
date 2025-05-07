import React from "react";
import { MapContainer, LayersControl, TileLayer } from "react-leaflet";
import CustomPane from "../new/CustomPane";
import CustomStyle from "../new/CustomStyle";
import FieldPolygons from "./FieldPolygons";
import { AutoFitToSelectedField, FitBoundsToPolygon } from "./ZoomControls";

import { Field } from "../../types"; // Adjust the path to where the Field type is defined

interface MapViewProps {
  filteredFields: Field[]; // Sử dụng đúng kiểu Field
  selectedField: Field | null; // Có thể null, không phải undefined
  handleFieldClick: (field: Field) => void;
  labelOpacity: number;
  mapRef: React.RefObject<any>;
}

const MapView: React.FC<MapViewProps> = ({
  filteredFields,
  selectedField,
  handleFieldClick,
  labelOpacity,
  mapRef,
}) => {
  return (
    <div className="h-[600px]">
      <MapContainer
        center={[20.14, 105.848]}
        zoom={17}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "0.5rem",
        }}
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

        {/* Hiển thị các đa giác */}
        <FieldPolygons
          fields={filteredFields}
          selectedField={selectedField}
          onFieldClick={handleFieldClick}
        />

        {/* Zoom to selected field */}
        {selectedField && (
          <>
            <FitBoundsToPolygon coordinates={selectedField.coordinates} />
            <AutoFitToSelectedField field={selectedField} />
          </>
        )}

        {/* Custom CSS filter */}
        <CustomStyle />
      </MapContainer>
    </div>
  );
};

export default MapView;
