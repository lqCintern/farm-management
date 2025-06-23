import React from 'react';
import { Link } from 'react-router-dom';
import { SupplyListing } from '@/services/supply_chain/supplyListingService';
import CategoryBadge from '../Common/CategoryBadge';
import { formatCurrency } from '@/utils/formatters';

interface SupplyListingCardProps {
  listing: SupplyListing;
  isFarmerView?: boolean;
}

const SupplyListingCard: React.FC<SupplyListingCardProps> = ({ listing, isFarmerView = true }) => {
  const routePrefix = isFarmerView ? '/farmer/listings' : '/supply-chain/supplier/listings';

  return (
    <Link 
      to={`${routePrefix}/${listing.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-w-3 aspect-h-2 w-full overflow-hidden">
        <img 
          src={listing.main_image || '/images/default-supply.jpg'} 
          alt={listing.name} 
          className="w-full h-full object-cover"
        />
        {listing.status === 'out_of_stock' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium px-3 py-1 rounded-full bg-red-600">Hết hàng</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-1">
          <CategoryBadge category={listing.category} />
          {listing.brand && (
            <span className="text-xs text-gray-600">{listing.brand}</span>
          )}
        </div>
        
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{listing.name}</h3>
        
        <div className="flex items-baseline mt-1">
          <span className="text-lg font-bold text-red-600">
            {formatCurrency(listing.price).replace('₫', 'đ')}
          </span>
          <span className="text-xs text-gray-600 ml-1">/{listing.unit}</span>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{listing.province || 'Toàn quốc'}</span>
          <span>Còn {listing.quantity} {listing.unit}</span>
        </div>
      </div>
    </Link>
  );
};

export default SupplyListingCard;
