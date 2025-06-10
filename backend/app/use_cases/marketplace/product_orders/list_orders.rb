module Marketplace
  module ProductOrders
    class ListOrders
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id:, user_type:, status: nil, page: 1, per_page: 10)
        is_seller = user_type == "farmer"

        # Lấy đơn hàng theo role
        if is_seller
          pagy, orders = @repository.list_for_seller(user_id, status, page, per_page)
        else
          pagy, orders = @repository.list_for_buyer(user_id, status, page, per_page)
        end

        # Lấy stats
        stats = @repository.get_stats(user_id, is_seller)

        {
          success: true,
          pagy: pagy,
          orders: orders,
          statistics: stats
        }
      end
    end
  end
end
