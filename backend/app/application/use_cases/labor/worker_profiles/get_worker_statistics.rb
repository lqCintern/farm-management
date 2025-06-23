module UseCases::Labor
  module WorkerProfiles
    class GetWorkerStatistics
      def initialize(repository)
        @repository = repository
      end

      def execute(user)
        @repository.get_statistics(user.id)
      end
    end
  end
end
