import { useEffect, useState } from "react";
import {
  getProductListings,
  ProductListing,
} from "@/services/marketplace/productListingsService";
import { ProductListingCard } from "./ProductListingCard";

export default function ProductListingList() {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await getProductListings();
        const typedResponse = response as {
          product_listings: ProductListing[];
        };
        setListings(typedResponse.product_listings); // Giả sử API trả về danh sách trong `product_listings`
      } catch (err: any) {
        console.error("Failed to fetch product listings:", err);
        setError(err.message || "Failed to load product listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-md">
          Không có bài đăng nào.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ProductListingCard
          key={listing.id}
          productListing={listing}
          showActions={false} // Ẩn các hành động nếu không cần
        />
      ))}
    </div>
  );
}
