
module Repositories
  module Marketplace
    class ProductListingRepositoryInterface
      def find(id)
        raise NotImplementedError
      end

      def find_with_associations(id)
        raise NotImplementedError
      end

      def list_published(params = {})
        raise NotImplementedError
      end

      def list_by_user(user_id, status = nil, page = 1, per_page = 10)
        raise NotImplementedError
      end

      def create(product_listing, images = [])
        raise NotImplementedError
      end

      def update(product_listing, images = [])
        raise NotImplementedError
      end

      def delete(id)
        raise NotImplementedError
      end

      def change_status(id, status)
        raise NotImplementedError
      end

      def increment_view_count(id)
        raise NotImplementedError
      end

      def increment_message_count(id)
        raise NotImplementedError
      end

      def increment_order_count(id)
        raise NotImplementedError
      end
    end
  end
end
