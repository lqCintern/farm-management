module UseCases::Labor
  module LaborAssignments
    class CheckScheduling
      def initialize(repository)
        @repository = repository
      end

      def check_conflicts(worker_id, date, start_time, end_time)
        @repository.check_conflicts(worker_id, date, start_time, end_time)
      end

      def get_worker_availability(worker_id, start_date, end_date)
        availability = @repository.get_worker_availability(worker_id, start_date, end_date)
        { success: true, availability: availability }
      end
    end
  end
end
