module UseCases::SupplyChain
  module SupplyOrders
    class UpdateSupplierOrderStatus
      def initialize(repository)
        @repository = repository
      end

      def execute(order_id, status, rejection_reason = nil)
        result = @repository.update_status(order_id, status, rejection_reason)

        if result[:success]
          order_dto = Dtos::SupplyChain::SupplyOrderDto.new(result[:order])
          { success: true, data: order_dto, message: result[:message] }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
