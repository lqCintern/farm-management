import React from 'react';
import { TileLayer, LayersControl } from 'react-leaflet';
import CustomPane from './CustomPane';
import CustomStyle from './CustomStyle';

interface MapLayersProps {
  labelOpacity: number;
}

const MapLayers: React.FC<MapLayersProps> = ({ labelOpacity }) => {
  return (
    <>
      {/* Tạo các custom panes */}
      <CustomPane name="base" zIndex={100} />
      <CustomPane name="overlay" zIndex={400} />
      <CustomPane name="labels" zIndex={650} />

      {/* Control chọn lớp bản đồ */}
      <LayersControl position="topright">
        {/* Lớp ảnh vệ tinh ESRI */}
        <LayersControl.BaseLayer name="Ảnh vệ tinh" checked>
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
            pane="base"
          />
        </LayersControl.BaseLayer>

        {/* Lớp OpenStreetMap tiêu chuẩn */}
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            pane="base"
          />
        </LayersControl.BaseLayer>

        {/* Overlay labels - lớp nhãn đường và tên địa điểm */}
        <LayersControl.Overlay name="Hiển thị tên đường và địa điểm" checked>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            pane="labels"
            opacity={labelOpacity}
            className="label-layer"
          />
        </LayersControl.Overlay>

        {/* Overlay thêm thông tin hành chính */}
        <LayersControl.Overlay name="Tên xã/huyện/tỉnh">
          <TileLayer
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-labels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stamen.com">Stamen Design</a>'
            pane="labels"
            opacity={labelOpacity * 0.8}
          />
        </LayersControl.Overlay>
      </LayersControl>

      {/* CSS filter để chỉ hiển thị nhãn từ OpenStreetMap */}
      <CustomStyle />
    </>
  );
};

export default MapLayers;