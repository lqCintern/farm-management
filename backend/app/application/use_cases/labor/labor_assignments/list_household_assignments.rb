module UseCases::Labor
  module LaborAssignments
    class ListHouseholdAssignments
      def initialize(repository)
        @repository = repository
      end

      def execute(household_id, filters = {})
        @repository.find_for_household(household_id, filters)
      end
    end
  end
end
