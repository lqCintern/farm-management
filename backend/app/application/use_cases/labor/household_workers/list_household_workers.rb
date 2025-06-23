module UseCases::Labor
  module HouseholdWorkers
    class ListHouseholdWorkers
      def initialize(repository)
        @repository = repository
      end

      def execute(household_id)
        @repository.find_by_household(household_id)
      end
    end
  end
end
