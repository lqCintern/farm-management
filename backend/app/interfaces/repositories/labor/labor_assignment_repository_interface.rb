module Repositories
  module Labor
    module LaborAssignmentRepositoryInterface
      def find(id)
        raise NotImplementedError
      end
      
      def find_for_request(request_id)
        raise NotImplementedError
      end
      
      def find_for_worker(worker_id, filters = {})
        raise NotImplementedError
      end
      
      def find_for_household(household_id, filters = {})
        raise NotImplementedError
      end
      
      def create(assignment_entity)
        raise NotImplementedError
      end
      
      def update(assignment_entity)
        raise NotImplementedError
      end
      
      def delete(id)
        raise NotImplementedError
      end
      
      def check_conflicts(worker_id, date, start_time, end_time)
        raise NotImplementedError
      end
      
      def get_worker_availability(worker_id, start_date, end_date)
        raise NotImplementedError
      end
      
      def rate_worker(id, rating)
        raise NotImplementedError
      end
      
      def rate_farmer(id, rating)
        raise NotImplementedError
      end
      
      def batch_create(assignments)
        raise NotImplementedError
      end
    end
  end
end