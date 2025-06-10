module Farming
  module Fields
    class GetFieldHarvests
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        @repository.find_harvests(id, user_id)
      end
    end
  end
end
