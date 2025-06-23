module UseCases::Farming
  module Fields
    class GetFieldActivities
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        @repository.find_activities(id, user_id)
      end
    end
  end
end
