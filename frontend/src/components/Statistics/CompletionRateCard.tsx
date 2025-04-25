import React from "react";

interface CompletionRateCardProps {
  rate: number;
}

export default function CompletionRateCard({ rate }: CompletionRateCardProps) {
  // Xác định màu sắc dựa trên tỷ lệ
  const getColor = () => {
    if (rate < 30) return "#ff4d4f";
    if (rate < 70) return "#faad14";
    return "#52c41a";
  };

  const color = getColor();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Tỷ lệ Hoàn thành</p>
          <h3 className="text-2xl font-bold" style={{ color }}>
            {rate}%
          </h3>
        </div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full"
          style={{ width: `${rate}%`, backgroundColor: color }}
        ></div>
      </div>

      <div className="mt-3 text-sm text-gray-500">
        {rate < 30
          ? "Tỷ lệ hoàn thành thấp. Cần cải thiện."
          : rate < 70
          ? "Tỷ lệ hoàn thành khá. Có thể cải thiện."
          : "Tỷ lệ hoàn thành tốt. Tiếp tục phát huy!"}
      </div>
    </div>
  );
}
