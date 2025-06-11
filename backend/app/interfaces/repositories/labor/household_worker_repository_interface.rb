module Repositories
  module Labor
    module HouseholdWorkerRepositoryInterface
      def find(id)
        raise NotImplementedError
      end
      
      def find_by_household(household_id)
        raise NotImplementedError
      end
      
      def create(household_worker_entity)
        raise NotImplementedError
      end
      
      def update(household_worker_entity)
        raise NotImplementedError
      end
      
      def delete(id)
        raise NotImplementedError
      end
      
      def update_status(id, is_active)
        raise NotImplementedError
      end
    end
  end
end
