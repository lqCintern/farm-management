import React from "react";

const MapControls: React.FC<{
  isDrawing: boolean;
  markersCount: number;
  labelOpacity: number;
  setLabelOpacity: (opacity: number) => void;
  startDrawing: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  optimizePolygon?: () => void;
}> = ({
  isDrawing,
  markersCount,
  labelOpacity,
  setLabelOpacity,
  startDrawing,
  finishDrawing,
  cancelDrawing,
  optimizePolygon,
}) => {
  // Ngăn chặn sự kiện submit form khi nhấn nút trong MapControls
  const handleButtonClick = (callback: () => void) => (e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn chặn sự kiện submit form
    callback();
  };

  return (
    <div className="mb-3 bg-white p-3 rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-grow">
          {isDrawing ? (
            <div className="flex items-center text-blue-600 font-medium">
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                ></path>
              </svg>
              <span>
                Đang vẽ đa giác - Click vào bản đồ để đánh dấu các điểm
              </span>
              {markersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {markersCount} điểm
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center text-gray-700">
              {markersCount >= 3 ? (
                <div className="flex items-center text-green-600">
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>
                    Đa giác hoàn thành - Bạn có thể di chuyển các điểm để điều
                    chỉnh
                  </span>
                </div>
              ) : (
                <span>Nhấn nút "Vẽ đa giác" để bắt đầu</span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isDrawing ? (
            <>
              <button
                type="button" // Đảm bảo đây là button thường, không phải submit
                className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={markersCount < 3}
                onClick={handleButtonClick(finishDrawing)}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Hoàn thành đa giác
              </button>
              <button
                type="button" // Đảm bảo đây là button thường, không phải submit
                className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
                onClick={handleButtonClick(cancelDrawing)}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
                Hủy
              </button>
            </>
          ) : (
            <>
              <button
                type="button" // Đảm bảo đây là button thường, không phải submit
                className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                onClick={handleButtonClick(startDrawing)}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
                {markersCount >= 3 ? "Vẽ lại đa giác" : "Vẽ đa giác"}
              </button>
              {markersCount >= 4 && optimizePolygon && (
                <button
                  type="button" // Đảm bảo đây là button thường, không phải submit
                  className="px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center"
                  onClick={handleButtonClick(optimizePolygon)}
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    ></path>
                  </svg>
                  Tối ưu đa giác
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Phần điều chỉnh độ mờ của nhãn */}
      <div className="mt-3">
        <label
          htmlFor="labelOpacity"
          className="block text-sm text-gray-600 mb-1"
        >
          Độ rõ của tên đường/địa điểm: {Math.round(labelOpacity * 100)}%
        </label>
        <input
          id="labelOpacity"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={labelOpacity}
          onChange={(e) => setLabelOpacity(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};

export default MapControls;
