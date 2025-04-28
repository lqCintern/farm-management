import React from "react";
import ProductListingList from "@/components/ProductListing/ProductListingList";

export default function ProductListingPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Danh sách bài đăng sản phẩm</h1>
      <ProductListingList />
    </div>
  );
}
