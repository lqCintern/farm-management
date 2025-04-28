import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateProductListingForm from "@/components/ProductListing/CreateForm";

export default function CreateProductPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Danh sách bài đăng sản phẩm</h1>
      <CreateProductListingForm />
    </div>
  );
}
