module UseCases::Marketplace
  module MarketplaceHarvests
    class ListMyHarvests
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, user_type, status = nil, page = 1, per_page = 10)
        if user_type == "farmer"
          # Farmer: lấy harvest của các sản phẩm mình bán
          @repository.list_for_farmer(user_id, status, page, per_page)
        else
          # Trader: lấy harvest mình đặt
          @repository.list_for_trader(user_id, status, page, per_page)
        end
      end
    end
  end
end 