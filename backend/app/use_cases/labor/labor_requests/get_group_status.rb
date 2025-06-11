module Labor
  module LaborRequests
    class GetGroupStatus
      def initialize(request_repository)
        @request_repository = request_repository
      end
      
      def execute(request_id)
        @request_repository.get_group_status(request_id)
      end
    end
  end
end