module Labor
  module LaborAssignments
    class ListRequestAssignments
      def initialize(repository)
        @repository = repository
      end
      
      def execute(request_id)
        @repository.find_for_request(request_id)
      end
    end
  end
end
