import React from 'react';
import { AlertTriangle } from 'react-feather';

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <div className="p-4 rounded-lg bg-red-50 flex items-center border border-red-200 max-w-2xl mx-auto my-8">
      <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
      <div>
        <h3 className="font-medium text-red-800">Đã xảy ra lỗi</h3>
        <p className="text-red-700">{message}</p>
      </div>
    </div>
  );
};

export default ErrorAlert;