import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  buttonType?: 'primary' | 'secondary' | 'success' | 'danger' | 'text';
  htmlType?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  buttonType = 'primary',
  htmlType = 'button',
  className = '',
  loading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const typeStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    text: 'bg-transparent hover:bg-gray-100 text-blue-600 hover:text-blue-800 focus:ring-blue-500'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';
  
  return (
    <button
      type={htmlType}
      className={`${baseStyles} ${typeStyles[buttonType]} ${(disabled || loading) ? disabledStyles : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* Children content */}
      {loading && <span className="mr-2">...</span>}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;