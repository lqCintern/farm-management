module Labor
  module WorkerProfiles
    class CheckWorkerAvailability
      def initialize(repository)
        @repository = repository
      end
      
      def execute(worker_id, start_date, end_date)
        @repository.get_availability_forecast(worker_id, start_date, end_date)
      end
    end
  end
end