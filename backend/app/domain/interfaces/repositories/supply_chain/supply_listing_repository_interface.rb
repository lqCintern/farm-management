module Interfaces::Repositories
  module SupplyChain
    module SupplyListingRepositoryInterface
      def find(id)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def find_all(filters = {}, page = 1, per_page = 15)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def create(entity)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def update(id, attributes)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def delete(id)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def increment_view_count(id)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def update_stock_after_order(id, ordered_quantity)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def find_similar(id, limit = 6)
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end

      def get_categories
        raise NotImplementedError, "#{self.class} has not implemented method '#{__method__}'"
      end
    end
  end
end
