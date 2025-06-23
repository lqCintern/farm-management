module UseCases::Marketplace
  module ProductListings
    class GetProductDetails
      def initialize(product_listing_repository)
        @product_listing_repository = product_listing_repository
      end

      def execute(id)
        product_listing = @product_listing_repository.find_with_associations(id)

        if product_listing
          { success: true, product_listing: product_listing }
        else
          { success: false, error: "Không tìm thấy sản phẩm" }
        end
      end
    end
  end
end
