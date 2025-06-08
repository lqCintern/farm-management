import React from 'react';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (quantity: number) => void;
  maxQuantity: number;
  unit: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({ 
  quantity, 
  setQuantity, 
  maxQuantity,
  unit
}) => {
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= 1}
        className="w-10 h-10 rounded-l-md border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
      >
        <span className="text-xl">-</span>
      </button>
      
      <input
        type="number"
        min="1"
        max={maxQuantity}
        value={quantity}
        onChange={handleChange}
        className="w-16 h-10 border-y border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
      />
      
      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= maxQuantity}
        className="w-10 h-10 rounded-r-md border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
      >
        <span className="text-xl">+</span>
      </button>
      
      <span className="ml-2 text-gray-600">{unit}</span>
    </div>
  );
};

export default QuantitySelector;
