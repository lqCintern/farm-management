module UseCases::SupplyChain
  module SupplyOrders
    class CancelFarmerOrder
      def initialize(repository)
        @repository = repository
      end

      def execute(order_id, user_id)
        result = @repository.cancel_order(order_id, user_id)

        if result[:success]
          { success: true, data: { status: result[:order].status }, message: result[:message] }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
