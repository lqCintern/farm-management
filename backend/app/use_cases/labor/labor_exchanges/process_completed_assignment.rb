module Labor
  module LaborExchanges
    class ProcessCompletedAssignment
      def initialize(exchange_repository)
        @exchange_repository = exchange_repository
      end
      
      def execute(assignment_id)
        @exchange_repository.process_assignment(assignment_id)
      end
    end
  end
end
