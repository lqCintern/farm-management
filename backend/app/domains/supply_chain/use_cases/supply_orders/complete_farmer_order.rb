module SupplyChain
  module SupplyOrders
    class CompleteFarmerOrder
      def initialize(order_repository, farm_material_repository)
        @order_repository = order_repository
        @farm_material_repository = farm_material_repository
      end
      
      def execute(order_id, user_id)
        # Complete order
        result = @order_repository.complete_order(order_id, user_id)
        
        unless result[:success]
          return { success: false, errors: result[:errors] }
        end
        
        # Update farm materials
        farm_material_result = @farm_material_repository.find_or_create_from_order(
          user_id, 
          result[:order].supply_listing, 
          result[:order].quantity
        )
        
        unless farm_material_result[:success]
          return { success: false, errors: farm_material_result[:errors] }
        end
        
        { 
          success: true, 
          data: { status: result[:order].status }, 
          message: result[:message] 
        }
      end
    end
  end
end