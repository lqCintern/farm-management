import React from 'react';
import Modal from '@/components/common/Modal';
import { AlertTriangle, XCircle, CheckCircle, HelpCircle } from 'react-feather';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  type = 'warning',
  confirmButtonClass = ''
}) => {
  
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle size={32} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={32} className="text-yellow-500" />;
      case 'success':
        return <CheckCircle size={32} className="text-green-500" />;
      case 'info':
      default:
        return <HelpCircle size={32} className="text-blue-500" />;
    }
  };
  
  const getConfirmButtonClass = () => {
    if (confirmButtonClass) return confirmButtonClass;
    
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full">
        <div className="px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonClass()}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;