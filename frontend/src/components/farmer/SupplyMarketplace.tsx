import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Input,
  Select,
  Slider,
  Button,
  Row,
  Col,
  Typography,
  Tag,
  Divider,
  Empty,
  Pagination,
  Collapse,
  Rate,
  Spin,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  ShopOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import supplyListingService, {
  SupplyListing,
} from "@/services/supply_chain/supplyListingService";
import { formatCurrency } from "@/utils/formatters";

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const SupplyMarketplace: React.FC = () => {
  const [listings, setListings] = useState<SupplyListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [maxPrice, setMaxPrice] = useState<number>(1000000);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const pageSize = 12;

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, [currentPage, selectedCategory, selectedProvince, priceRange, searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await supplyListingService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        per_page: pageSize,
      };

      if (searchTerm) params.name = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedProvince) params.province = selectedProvince;
      if (priceRange[0] > 0) params.min_price = priceRange[0];
      if (priceRange[1] < maxPrice) params.max_price = priceRange[1];

      const response = await supplyListingService.getListings(params);
      setListings(response.data.items || []);
      setTotalItems(response.data.total || 0);

      // Extract unique provinces
      const uniqueProvinces = Array.from(
        new Set(
          response.data.items
            .map((item: SupplyListing) => item.province)
            .filter(Boolean)
        )
      );
      setProvinces(uniqueProvinces as string[]);

      // Find max price for slider
      const highest = Math.max(
        ...response.data.items.map((item: SupplyListing) => item.price),
        1000000
      );
      setMaxPrice(highest);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedProvince(null);
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const categoryLabels: Record<string, string> = {
    fertilizer: "Phân bón",
    pesticide: "Thuốc BVTV",
    seed: "Hạt giống",
    tool: "Công cụ",
    other: "Khác",
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <Title level={2}>Mua vật tư nông nghiệp</Title>

      {/* Search and Filter Section */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="Tìm kiếm vật tư nông nghiệp"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={() => setCurrentPage(1)}
            className="md:w-1/3"
            size="large"
            allowClear
          />

          <Select
            placeholder="Danh mục"
            value={selectedCategory}
            onChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1);
            }}
            className="md:w-1/4"
            size="large"
            allowClear
          >
            {categories.map((category) => (
              <Option key={category} value={category}>
                {categoryLabels[category] || category}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Tỉnh/Thành phố"
            value={selectedProvince}
            onChange={(value) => {
              setSelectedProvince(value);
              setCurrentPage(1);
            }}
            className="md:w-1/4"
            size="large"
            allowClear
          >
            {provinces.map((province) => (
              <Option key={province} value={province}>
                {province}
              </Option>
            ))}
          </Select>

          <Button onClick={handleResetFilters} type="default" size="large">
            Đặt lại bộ lọc
          </Button>
        </div>

        <Collapse ghost>
          <Panel header="Bộ lọc nâng cao" key="1" extra={<FilterOutlined />}>
            <div className="mb-4">
              <Text strong>Khoảng giá:</Text>
              <Slider
                range
                min={0}
                max={maxPrice}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
                tipFormatter={(value) => (value ? formatCurrency(value) : "0đ")}
                onAfterChange={() => setCurrentPage(1)}
              />
              <div className="flex justify-between">
                <Text>{formatCurrency(priceRange[0])}</Text>
                <Text>{formatCurrency(priceRange[1])}</Text>
              </div>
            </div>
          </Panel>
        </Collapse>
      </Card>

      {/* Product Listing */}
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          {loading ? (
            <div className="w-full flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <Col xs={24} sm={12} md={8} lg={6} key={listing.id}>
                <Link to={`/supply-listings/${listing.id}`}>
                  <Card
                    hoverable
                    cover={
                      <div className="h-48 overflow-hidden">
                        {listing.main_image ? (
                          <img
                            alt={listing.name}
                            src={listing.main_image}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className="mb-2">
                      <Tag color="blue">
                        {categoryLabels[listing.category] || listing.category}
                      </Tag>
                    </div>

                    <Typography.Title level={5} className="line-clamp-2 h-12">
                      {listing.name}
                    </Typography.Title>

                    <div className="flex justify-between items-center mb-2">
                      <Text className="text-red-600 font-bold text-lg">
                        {formatCurrency(listing.price).replace("₫", "")}
                      </Text>
                      <Text className="text-gray-500">/{listing.unit}</Text>
                    </div>

                    {listing.brand && (
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <ShopOutlined className="mr-1" /> {listing.brand}
                      </div>
                    )}

                    {listing.province && (
                      <div className="flex items-center text-gray-500 text-sm">
                        <EnvironmentOutlined className="mr-1" />{" "}
                        {listing.province}
                      </div>
                    )}

                    <Divider className="my-2" />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <StarOutlined className="text-yellow-500 mr-1" />
                        <Text className="text-sm">4.5</Text>
                      </div>
                      <Text className="text-sm text-gray-500">
                        Đã bán: {listing.order_count || 0}
                      </Text>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty
                description="Không tìm thấy vật tư phù hợp"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Col>
          )}
        </Row>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex justify-center my-6">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default SupplyMarketplace;
