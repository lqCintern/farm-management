module Labor
  module LaborRequests
    class GetRequest
      def initialize(request_repository)
        @request_repository = request_repository
      end
      
      def execute(id)
        @request_repository.find(id)
      end
    end
  end
end