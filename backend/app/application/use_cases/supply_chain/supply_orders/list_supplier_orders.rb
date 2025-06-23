module UseCases::SupplyChain
  module SupplyOrders
    class ListSupplierOrders
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, filters = {})
        result = @repository.find_by_supplier(user_id, filters)

        if result[:success]
          orders = result[:orders].map { |order| Dtos::SupplyChain::SupplyOrderDto.new(order) }
          { success: true, data: orders }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
