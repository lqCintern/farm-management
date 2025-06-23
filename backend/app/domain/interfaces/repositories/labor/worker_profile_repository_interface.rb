module Interfaces::Repositories
  module Labor
    module WorkerProfileRepositoryInterface
      def find(id)
        raise NotImplementedError
      end

      def find_by_user_id(user_id)
        raise NotImplementedError
      end

      def find_available_workers(criteria = {})
        raise NotImplementedError
      end

      def create(worker_profile_entity)
        raise NotImplementedError
      end

      def update(worker_profile_entity)
        raise NotImplementedError
      end

      def get_statistics(user_id)
        raise NotImplementedError
      end

      def check_schedule_conflicts(worker_id, date, start_time, end_time)
        raise NotImplementedError
      end

      def get_availability_forecast(worker_id, start_date, end_date)
        raise NotImplementedError
      end
    end
  end
end
