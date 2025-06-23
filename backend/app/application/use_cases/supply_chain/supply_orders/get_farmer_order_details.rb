module UseCases::SupplyChain
  module SupplyOrders
    class GetFarmerOrderDetails
      def initialize(repository)
        @repository = repository
      end

      def execute(order_id, user_id)
        result = @repository.find(order_id)

        if result[:success]
          if result[:order].user_id != user_id
            return { success: false, errors: [ "Bạn không có quyền xem đơn hàng này" ] }
          end

          order_dto = Dtos::SupplyChain::SupplyOrderDto.new(result[:order], true, user_id)
          { success: true, data: order_dto }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
