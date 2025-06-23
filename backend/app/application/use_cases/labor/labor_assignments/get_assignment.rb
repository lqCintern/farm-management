module UseCases::Labor
  module LaborAssignments
    class GetAssignment
      def initialize(repository)
        @repository = repository
      end

      def execute(id)
        @repository.find(id)
      end
    end
  end
end
