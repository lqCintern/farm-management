module UseCases::Farming
  module Fields
    class GetFieldPineappleCrops
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        @repository.find_pineapple_crops(id, user_id)
      end
    end
  end
end
