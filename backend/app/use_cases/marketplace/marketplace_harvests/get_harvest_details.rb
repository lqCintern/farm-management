module Marketplace
  module MarketplaceHarvests
    class GetHarvestDetails
      def initialize(repository)
        @repository = repository
      end

      def execute(id)
        harvest = @repository.find_with_associations(id)
        
        if harvest
          { success: true, harvest: harvest }
        else
          { success: false, error: "Không tìm thấy lịch thu hoạch" }
        end
      end
    end
  end
end