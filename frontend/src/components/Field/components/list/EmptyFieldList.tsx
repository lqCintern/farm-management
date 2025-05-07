import React from "react";

const EmptyFieldList: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
      <p>Không tìm thấy cánh đồng nào phù hợp</p>
    </div>
  );
};

export default EmptyFieldList;
