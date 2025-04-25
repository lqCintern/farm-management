import React from 'react';

interface DrawControlsProps {
  isDrawing: boolean;
  markers: { lat: number; lng: number }[];
  labelOpacity: number;
  setLabelOpacity: (opacity: number) => void;
  startDrawing: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  optimizePolygon: () => void;
}

const DrawControls: React.FC<DrawControlsProps> = ({
  isDrawing,
  markers,
  labelOpacity,
  setLabelOpacity,
  startDrawing,
  finishDrawing,
  cancelDrawing,
  optimizePolygon,
}) => {
  return (
    <div className="buttons" style={{ marginBottom: "10px" }}>
      {!isDrawing ? (
        <button onClick={startDrawing} className="btn btn-primary">
          Bắt đầu vẽ đa giác
        </button>
      ) : (
        <>
          <button
            onClick={finishDrawing}
            disabled={markers.length < 3}
            className="btn btn-success"
          >
            Hoàn thành đa giác
          </button>
          <button
            onClick={cancelDrawing}
            className="btn btn-danger"
          >
            Hủy
          </button>
          <button
            onClick={optimizePolygon}
            disabled={markers.length < 4}
            title="Giảm số điểm của đa giác"
            style={{ marginLeft: "10px" }}
            className="btn"
          >
            Tối ưu điểm
          </button>
        </>
      )}

      <div style={{ marginTop: "10px" }}>
        <label>
          Độ hiển thị tên địa điểm:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={labelOpacity}
            onChange={(e) => setLabelOpacity(parseFloat(e.target.value))}
            style={{ marginLeft: "10px", verticalAlign: "middle" }}
          />
        </label>
      </div>
    </div>
  );
};

export default DrawControls;