
  module UseCases
    module SupplyChain
      module Farmer
        class CompleteOrderAndUpdateInventory
          def initialize(supply_order_repository, farm_material_repository)
            @supply_order_repository = supply_order_repository
            @farm_material_repository = farm_material_repository
          end

          def execute(order_id, farmer_id)
            # Bước 1: Hoàn thành đơn hàng
            order_result = @supply_order_repository.complete_order(order_id, farmer_id)
            
            return order_result unless order_result[:success]
            
            # Bước 2: Nếu thành công, cập nhật vật tư trong kho
            order = order_result[:order]
            update_inventory_result = update_farm_inventory(order, farmer_id)
            
            if update_inventory_result[:success]
              { 
                success: true, 
                order: order, 
                message: "Xác nhận nhận hàng thành công. Kho vật tư đã được cập nhật." 
              }
            else
              # Vẫn hoàn thành đơn hàng, nhưng thông báo lỗi khi cập nhật kho
              { 
                success: true, 
                order: order, 
                message: "Xác nhận nhận hàng thành công nhưng có lỗi khi cập nhật kho vật tư.",
                inventory_errors: update_inventory_result[:errors]
              }
            end
          end
          
          private
          
          def update_farm_inventory(order, farmer_id)
            begin
              supply = order.supply_listing
              
              # Tìm vật tư hiện có trong kho của nông dân
              existing_material = @farm_material_repository.find_by_material_id(farmer_id, supply[:id])
              
              if existing_material
                # Cập nhật nếu đã tồn tại
                update_result = @farm_material_repository.update(
                  existing_material.id,
                  { 
                    quantity: existing_material.quantity + order.quantity, 
                    last_updated: Time.current 
                  },
                  farmer_id
                )
                
                return { success: false, errors: update_result[:errors] } unless update_result[:success]
              else
                # Tạo mới nếu chưa tồn tại
                create_result = @farm_material_repository.create(
                  {
                    name: supply[:name],
                    material_id: supply[:id],
                    quantity: order.quantity,
                    unit: supply[:unit],
                    category: convert_category(supply[:category]),
                    last_updated: Time.current
                  },
                  farmer_id
                )
                
                return { success: false, errors: create_result[:errors] } if create_result[:success] == false
              end
              
              { success: true }
            rescue => e
              { success: false, errors: ["Lỗi khi cập nhật kho vật tư: #{e.message}"] }
            end
          end
          
          def convert_category(supply_category)
            # Chuyển đổi category từ supply_listing sang farm_material
            category_map = {
              "fertilizer" => "fertilizer",
              "pesticide" => "pesticide",
              "seed" => "seed",
              "tool" => "tool"
            }
            
            category_map[supply_category.to_s] || "other"
          end
        end
      end
    end
  end
