module Marketplace
  module ProductListings
    class ListMyListings
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id:, status: nil, page: 1, per_page: 10)
        @repository.list_by_user(user_id, status, page, per_page)
      end
    end
  end
end
