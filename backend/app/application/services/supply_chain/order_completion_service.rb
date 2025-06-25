module Services
  module SupplyChain
    class OrderCompletionService
      def complete_order(order_id, user_id)
        # Lấy repository qua service locator
        order_repo = Services::CleanArch.supply_chain_supply_order_repository
        
        # Xử lý hoàn thành đơn hàng
        result = order_repo.complete_order(order_id, user_id)
        
        # Nếu thành công, cập nhật kho
        if result[:success] && result[:order]
          update_inventory(result[:order])
        end
        
        result
      end
      
      private
      
      def update_inventory(order)
        return unless order.farmer_id
        
        # Lấy repository qua service locator
        material_repo = Services::CleanArch.farming_farm_material_repository
        
        order.items.each do |item|
          supply = item.supply_listing
          existing_material = material_repo.find_by_material_id(order.farmer_id, supply.id)
          
          if existing_material
            new_quantity = existing_material.quantity + item.quantity
            material_repo.update(
              existing_material.id, 
              { quantity: new_quantity, last_updated: Time.current },
              order.farmer_id
            )
          else
            material_repo.create({
              name: supply.name,
              material_id: supply.id,
              quantity: item.quantity,
              unit: supply.unit,
              category: supply.category,
              last_updated: Time.current
            }, order.farmer_id)
          end
        end
      end
    end
  end
end
