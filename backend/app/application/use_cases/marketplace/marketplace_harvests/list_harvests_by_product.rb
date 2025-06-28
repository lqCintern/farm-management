module UseCases::Marketplace
  module MarketplaceHarvests
    class ListHarvestsByProduct
      def initialize(repository)
        @repository = repository
      end

      def execute(product_listing_id)
        @repository.find_by_product_listing(product_listing_id)
      end
    end
  end
end 