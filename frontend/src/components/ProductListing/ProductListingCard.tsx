import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { ProductListing } from "@/services/productListingsService";
//import { useState, useEffect } from "react";
//import { useParams } from "react-router-dom";
//import { getProductListingById } from "@/services/productListingsService";

interface ProductListingCardProps {
  productListing: ProductListing;
  showActions?: boolean;
  onToggleStatus?: (id: number, status: "activate" | "hide" | "draft") => void;
  onDelete?: (id: number) => void;
}

const STATUS_LABELS = {
  0: { label: "Bản nháp", color: "bg-gray-500" },
  1: { label: "Đang rao bán", color: "bg-green-500" },
  2: { label: "Đã bán", color: "bg-blue-500" },
  3: { label: "Đã ẩn", color: "bg-red-500" },
};

export function ProductListingCard({
  productListing,
  showActions = false,
  onToggleStatus,
  onDelete,
}: ProductListingCardProps) {
  const {
    id,
    title,
    description,
    status,
    price_expectation,
    harvest_start_date,
    harvest_end_date,
    product_images,
    location_text,
    thumbnail,
    seller_name,
    view_count,
  } = productListing;

  const thumbnailUrl =
    thumbnail ||
    (product_images && product_images.length > 0
      ? product_images[0].image_url
      : "/images/placeholder.png");
  const statusInfo =
    STATUS_LABELS[status as keyof typeof STATUS_LABELS] || STATUS_LABELS[3];

  const statusActions = {
    0: { action: "activate", label: "Đăng bán" },
    1: { action: "hide", label: "Ẩn bài đăng" },
    3: { action: "activate", label: "Hiển thị lại" },
  };

  const currentStatusAction =
    statusActions[status as keyof typeof statusActions];

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative pt-[56.25%]">
        {/* Thay thế next/image bằng thẻ img */}
        <img
          src={thumbnailUrl}
          alt={title}
          className="object-cover w-full h-full"
        />
        <Badge className={`absolute top-2 right-2 ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
      </div>

      <CardHeader className="p-4 pb-0">
        {/* Thay thế next/link bằng react-router-dom Link */}
        <Link to={`/products/${id}`} className="hover:text-primary">
          <h3 className="text-xl font-semibold line-clamp-2">{title}</h3>
        </Link>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-gray-600 mb-2">{location_text}</p>
        <p className="text-sm line-clamp-2 text-gray-500 mb-3">{description}</p>

        {price_expectation && (
          <p className="font-bold text-lg text-primary">
            {formatCurrency(price_expectation)}
            <span className="text-sm font-normal">/kg</span>
          </p>
        )}

        {harvest_start_date && harvest_end_date && (
          <p className="text-sm mt-2">
            <span className="font-medium">Thời gian thu hoạch:</span>{" "}
            {formatDate(harvest_start_date)} - {formatDate(harvest_end_date)}
          </p>
        )}

        {seller_name && (
          <p className="text-sm mt-1">
            <span className="font-medium">Người đăng:</span> {seller_name}
          </p>
        )}

        {view_count !== undefined && (
          <div className="flex items-center mt-2 text-gray-500 text-sm">
            <span className="mr-1">👁️</span> {view_count} lượt xem
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 justify-between">
          <Link
            to={`/farmer/products/edit/${id}`}
            className="btn btn-sm btn-outline"
          >
            Chỉnh sửa
          </Link>

          {currentStatusAction && onToggleStatus && (
            <button
              onClick={() =>
                onToggleStatus(id!, currentStatusAction.action as any)
              }
              className="btn btn-sm btn-primary"
            >
              {currentStatusAction.label}
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(id!)}
              className="btn btn-sm btn-error"
            >
              Xóa
            </button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
