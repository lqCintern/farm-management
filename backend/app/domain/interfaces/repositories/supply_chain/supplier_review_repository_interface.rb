module Interfaces::Repositories
  module SupplyChain
    module SupplierReviewRepositoryInterface
      def find_by_supplier(supplier_id, page = 1, per_page = 10)
        raise NotImplementedError
      end

      def find_by_order(order_id)
        raise NotImplementedError
      end

      def create(entity)
        raise NotImplementedError
      end

      def get_supplier_rating_stats(supplier_id)
        raise NotImplementedError
      end
    end
  end
end
