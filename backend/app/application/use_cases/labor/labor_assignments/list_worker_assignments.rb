module UseCases::Labor
  module LaborAssignments
    class ListWorkerAssignments
      def initialize(repository)
        @repository = repository
      end

      def execute(worker_id, filters = {})
        @repository.find_for_worker(worker_id, filters)
      end
    end
  end
end
