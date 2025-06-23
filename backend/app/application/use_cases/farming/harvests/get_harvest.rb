module UseCases::Farming
  module Harvests
    class GetHarvest
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        harvest = @repository.find_by_id(id, user_id)

        if harvest
          { success: true, harvest: harvest }
        else
          { success: false, error: "Không tìm thấy thu hoạch" }
        end
      end
    end
  end
end
