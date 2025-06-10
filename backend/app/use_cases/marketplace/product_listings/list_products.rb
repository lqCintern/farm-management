module Marketplace
  module ProductListings
    class ListProducts
      def initialize(repository)
        @repository = repository
      end

      def execute(product_type: nil, province: nil, min_price: nil, max_price: nil, 
                 ready_to_harvest: nil, sort: nil, page: 1, per_page: 12)
        params = {
          product_type: product_type,
          province: province,
          min_price: min_price,
          max_price: max_price,
          ready_to_harvest: ready_to_harvest,
          sort: sort,
          page: page,
          per_page: per_page
        }
        
        @repository.list_published(params)
      end
    end
  end
end
