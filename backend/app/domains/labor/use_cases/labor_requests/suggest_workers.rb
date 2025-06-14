module Labor
  module LaborRequests
    class SuggestWorkers
      def initialize(request_repository, worker_profile_repository)
        @request_repository = request_repository
        @worker_profile_repository = worker_profile_repository
      end
      
      def execute(request_id, max_suggestions = 5)
        # Find request
        request_result = @request_repository.find(request_id)
        return { success: false, errors: ["Không tìm thấy yêu cầu lao động"] } unless request_result[:success]
        
        request = request_result[:request]
        
        # Get worker suggestions
        workers = @worker_profile_repository.find_workers_for_request(request, max_suggestions)
        
        { success: true, workers: workers }
      end
    end
  end
end
