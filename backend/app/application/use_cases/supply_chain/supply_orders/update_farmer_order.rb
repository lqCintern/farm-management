module UseCases::SupplyChain
  module SupplyOrders
    class UpdateFarmerOrder
      def initialize(repository)
        @repository = repository
      end

      def execute(order_id, user_id, params)
        # Verify ownership
        order_result = @repository.find(order_id)

        unless order_result[:success]
          return { success: false, errors: order_result[:errors] }
        end

        if order_result[:order].user_id != user_id
          return { success: false, errors: [ "Bạn không có quyền cập nhật đơn hàng này" ] }
        end

        # Check if order is in pending status
        unless order_result[:order].pending?
          return { success: false, errors: [ "Chỉ có thể cập nhật đơn hàng ở trạng thái chờ xác nhận" ] }
        end

        # Update order
        result = @repository.update(order_id, params)

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
