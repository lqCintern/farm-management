import React, { useRef } from "react";
import { MapContainer } from "react-leaflet";
import CustomPane from "../new/CustomPane";
import CustomStyle from "../new/CustomStyle";
import CustomMapLayers from "./CustomMapLayers";
import FieldPolygons from "./FieldPolygons";
import { AutoFitToSelectedField, FitBoundsToPolygon } from "./ZoomControls";
import { Field } from "../../types";

interface FieldMapProps {
  fields: Field[];
  selectedField: Field | null;
  onFieldClick: (field: Field) => void;
  labelOpacity: number;
}

const FieldMap: React.FC<FieldMapProps> = ({
  fields,
  selectedField,
  onFieldClick,
  labelOpacity,
}) => {
  const mapRef = useRef(null);

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
        <CustomMapLayers labelOpacity={labelOpacity} />

        {/* Field Polygons */}
        <FieldPolygons
          fields={fields}
          selectedField={selectedField}
          onFieldClick={onFieldClick}
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

export default FieldMap;
