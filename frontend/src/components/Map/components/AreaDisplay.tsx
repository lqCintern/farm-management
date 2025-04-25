import React from "react";

interface AreaDisplayProps {
  area: number | null;
  markers: { lat: number; lng: number }[];
}

const AreaDisplay: React.FC<AreaDisplayProps> = ({ area, markers }) => {
  if (area === null) return null;

  return (
    <div
      className="area-display"
      style={{
        marginTop: "15px",
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "5px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h4>Thông tin đa giác</h4>
      <p>
        <strong>Diện tích:</strong> {area.toFixed(2)} m²
      </p>
      <details>
        <summary>Xem tọa độ chi tiết</summary>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                STT
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Vĩ độ (Lat)
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Kinh độ (Lng)
              </th>
            </tr>
          </thead>
          <tbody>
            {markers.map((coord, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {coord.lat.toFixed(6)}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {coord.lng.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};

export default AreaDisplay;
