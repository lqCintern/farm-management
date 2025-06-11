module Labor
  module WorkerProfiles
    class FindAvailableWorkers
      def initialize(repository)
        @repository = repository
      end
      
      def execute(criteria = {})
        @repository.find_available_workers(criteria)
      end
    end
  end
end