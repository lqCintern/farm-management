module Repositories
  module Marketplace
    class MarketplaceHarvestRepository
      def find(id)
        raise NotImplementedError
      end

      def find_with_associations(id)
        raise NotImplementedError
      end

      def list_for_farmer(farmer_id, status = nil, page = 1, items_per_page = 10)
        raise NotImplementedError
      end

      def list_for_trader(trader_id, status = nil, page = 1, items_per_page = 10)
        raise NotImplementedError
      end

      def find_by_product_listing(product_listing_id)
        raise NotImplementedError
      end

      def create(marketplace_harvest)
        raise NotImplementedError
      end

      def update(marketplace_harvest)
        raise NotImplementedError
      end

      def delete(id)
        raise NotImplementedError
      end

      def attach_payment_proof(id, image)
        raise NotImplementedError
      end
    end
  end
end
