module Marketplace
  module ProductListings
    class CreateProductListing
      def initialize(repository)
        @repository = repository
      end

      def execute(attributes, user_id, images = [])
        # Thêm user_id vào attributes
        attributes[:user_id] = user_id

        # Khởi tạo entity mới từ attributes
        entity = Entities::Marketplace::ProductListing.new(attributes)

        # Lưu entity qua repository
        result = @repository.create(entity, images)

        if result
          {
            success: true,
            message: "Sản phẩm đã được tạo thành công",
            product_listing: result
          }
        else
          {
            success: false,
            errors: [ "Không thể tạo sản phẩm" ],
            message: "Không thể tạo sản phẩm"
          }
        end
      end
    end
  end
end
