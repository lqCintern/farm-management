module UseCases::SupplyChain
  module SupplyOrders
    class GetSupplierDashboard
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id)
        result = @repository.get_supplier_dashboard_stats(user_id)

        if result[:success]
          stats = result[:data]
          stats[:recent_orders] = stats[:recent_orders].map { |order| Dtos::SupplyChain::SupplyOrderDto.new(order) }
          { success: true, data: stats }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
