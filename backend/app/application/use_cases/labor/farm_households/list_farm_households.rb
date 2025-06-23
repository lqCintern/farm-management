module UseCases::Labor
  module FarmHouseholds
    class ListFarmHouseholds
      def initialize(repository)
        @repository = repository
      end

      def execute
        @repository.all
      end
    end
  end
end
