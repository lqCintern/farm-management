import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  label,
}) => {
  return (
    <label className={`inline-flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out rounded border-gray-300 focus:ring-blue-500"
      />
      {label && <span className="ml-2">{label}</span>}
    </label>
  );
};

export default Checkbox;