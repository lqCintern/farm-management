module Repositories
  module Labor
    module FarmHouseholdRepositoryInterface
      def find(id)
        raise NotImplementedError
      end
      
      def all
        raise NotImplementedError
      end
      
      def create(household_entity)
        raise NotImplementedError
      end
      
      def update(household_entity)
        raise NotImplementedError
      end
      
      def delete(id)
        raise NotImplementedError
      end
      
      def get_summary(id)
        raise NotImplementedError
      end
      
      def add_worker(household_id, worker_id, params)
        raise NotImplementedError
      end
    end
  end
end