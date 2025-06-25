module UseCases
  module SupplyChain
    module Farmer
      class CompleteOrderAndUpdateInventory
        def initialize(supply_order_repository, farm_material_inventory_service)
          @supply_order_repository = supply_order_repository
          @inventory_service = farm_material_inventory_service
        end

        def execute(order_id, farmer_id)
          # Tìm đơn hàng và kiểm tra
          result = @supply_order_repository.find(order_id)
          return result unless result[:success]
  
          order = result[:order] || result[:data]
          return { success: false, errors: ["Đơn hàng không tồn tại"] } unless order
          return { success: false, errors: ["Chỉ đơn hàng đã giao mới có thể được hoàn thành"] } unless order.status == "delivered"

          # Đánh dấu đơn hàng đã hoàn thành
          complete_result = @supply_order_repository.update(order_id, { status: "completed"})
          return complete_result unless complete_result[:success]

          # Quan trọng: Lấy đơn hàng đã cập nhật từ kết quả
          updated_order = complete_result[:order] || complete_result[:data]
  
          # Cập nhật kho vật tư với đơn hàng đã cập nhật
          begin
            inventory_result = update_farm_inventory(updated_order, farmer_id)
            if inventory_result && inventory_result[:success] == false
              # Nếu có lỗi cập nhật kho, vẫn trả về thành công nhưng kèm warning
              return { 
                success: true, 
                data: updated_order, 
                warning: "Đơn hàng đã hoàn thành nhưng có lỗi khi cập nhật kho",
                inventory_error: inventory_result[:errors] || inventory_result[:error]
              }
            end
          rescue => e
            # Xử lý ngoại lệ nếu có
            Rails.logger.error("Lỗi khi cập nhật kho: #{e.message}")
            return { 
              success: true, 
              data: updated_order,
              warning: "Đơn hàng đã hoàn thành nhưng có lỗi khi cập nhật kho: #{e.message}"
            }
          end

          # Trả về thành công với đơn hàng đã cập nhật
          { success: true, data: updated_order }
        end

        private

        def update_farm_inventory(order, farmer_id)
          Rails.logger.info("Bắt đầu cập nhật kho từ đơn hàng #{order.id}")
          Rails.logger.info("Supply listing: #{order.supply_listing.inspect}")
          Rails.logger.info("Giá: #{order.price}")
          
          result = @inventory_service.update_from_supply_order(order.id, order, farmer_id)
          
          Rails.logger.info("Kết quả cập nhật kho: #{result.inspect}")
          result
        end
      end
    end
  end
end
