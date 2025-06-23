module Interfaces::Repositories
  module Labor
    module LaborRequestRepositoryInterface
      def find(id)
        raise NotImplementedError
      end

      def find_for_household(household_id, filters = {})
        raise NotImplementedError
      end

      def find_public_requests(filters = {})
        raise NotImplementedError
      end

      def find_related_requests(request_id)
        raise NotImplementedError
      end

      def find_by_farm_activity(household_id, farm_activity_id)
        raise NotImplementedError
      end

      def create(request_attributes)
        raise NotImplementedError
      end

      def update(id, attributes)
        raise NotImplementedError
      end

      def delete(id)
        raise NotImplementedError
      end

      def get_group_status(request_id)
        raise NotImplementedError
      end

      def create_group_requests(requesting_household_id, provider_ids, params, options = {})
        raise NotImplementedError
      end

      def can_household_join_request(request_id, household_id)
        raise NotImplementedError
      end

      def has_pending_assignments(request_id)
        raise NotImplementedError
      end
    end
  end
end
