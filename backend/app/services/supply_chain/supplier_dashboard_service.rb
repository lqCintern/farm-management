module SupplyChain
  class SupplierDashboardService
    def initialize(user)
      @user = user
    end

    def get_dashboard_stats
      # Thống kê số lượng đơn hàng theo trạng thái
      order_stats = ::SupplyChain::SupplyOrder.joins(:supply_listing)
                                 .where(supply_listings: { user_id: @user.user_id })
                                 .group(:status)
                                 .count

      # Thống kê doanh thu
      revenue = ::SupplyChain::SupplyOrder.joins(:supply_listing)
                             .where(supply_listings: { user_id: @user.user_id })
                             .where(status: [ :completed, :delivered ])
                             .sum("supply_orders.price * supply_orders.quantity")

      # Thống kê vật tư theo danh mục
      listing_stats = @user.supply_listings
                           .group(:category)
                           .count

      {
        order_stats: order_stats,
        revenue: revenue,
        listing_stats: listing_stats,
        pending_orders: ::SupplyChain::SupplyOrder.joins(:supply_listing)
                                    .where(supply_listings: { user_id: @user.user_id })
                                    .where(status: :pending)
                                    .count,
        reviews_avg: @user.average_rating
      }
    end
  end
end
