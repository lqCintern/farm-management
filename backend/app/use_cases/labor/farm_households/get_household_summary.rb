module Labor
  module FarmHouseholds
    class GetHouseholdSummary
      def initialize(repository )
        @repository = repository
      end
      
      def execute(id)
        @repository.get_summary(id)
      end
    end
  end
end
