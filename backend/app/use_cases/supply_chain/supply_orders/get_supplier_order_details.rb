module SupplyChain
  module SupplyOrders
    class GetSupplierOrderDetails
      def initialize(repository)
        @repository = repository
      end
      
      def execute(order_id)
        result = @repository.find(order_id)
        
        if result[:success]
          order_dto = Dtos::SupplyChain::SupplyOrderDto.new(result[:order], true)
          { success: true, data: order_dto }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end