module Marketplace
  module MarketplaceHarvests
    class ListHarvests
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id:, user_type:, status: nil, page: 1, per_page: 10)
        if user_type == "farmer"
          @repository.list_for_farmer(user_id, status, page, per_page)
        else
          @repository.list_for_trader(user_id, status, page, per_page)
        end
      end
    end
  end
end
