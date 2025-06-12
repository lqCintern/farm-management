module Labor
  module LaborRequests
    class ListPublicRequests
      def initialize(request_repository)
        @request_repository = request_repository
      end
      
      def execute(filters = {})
        @request_repository.find_public_requests(filters)
      end
    end
  end
end