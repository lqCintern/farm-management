module Repositories
  module SupplyChain
    module SupplyOrderRepositoryInterface
      def find(id)
        raise NotImplementedError
      end
      
      def find_by_user(user_id, filters = {})
        raise NotImplementedError
      end
      
      def find_by_supplier(user_id, filters = {})
        raise NotImplementedError
      end
      
      def create(entity, supply_listing)
        raise NotImplementedError
      end
      
      def update(id, attributes)
        raise NotImplementedError
      end
      
      def update_status(id, status, rejection_reason = nil)
        raise NotImplementedError
      end
      
      def cancel_order(id, user_id)
        raise NotImplementedError
      end
      
      def complete_order(id, user_id)
        raise NotImplementedError
      end
      
      def get_supplier_dashboard_stats(user_id)
        raise NotImplementedError
      end
    end
  end
end