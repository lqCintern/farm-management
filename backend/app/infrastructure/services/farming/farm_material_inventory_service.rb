module Services
  module Farming
    class FarmMaterialInventoryService
      def initialize(farm_material_repository, transaction_repository)
        @farm_material_repository = farm_material_repository
        @transaction_repository = transaction_repository
      end

      def update_from_supply_order(order_id, supply_order, user_id)
        begin
          Rails.logger.info("Cập nhật kho từ đơn hàng #{order_id}: #{supply_order.inspect}")
          
          # Lấy thông tin cơ bản từ đơn hàng - đơn giản hơn
          quantity = supply_order.quantity.to_f
          unit_price = supply_order.price.to_f  # price đã là đơn giá rồi
          total_price = quantity * unit_price
          
          supply_listing = supply_order.supply_listing
          listing_id = get_attribute(supply_listing, :id)
          listing_name = get_attribute(supply_listing, :name)
          listing_unit = get_attribute(supply_listing, :unit)
          listing_category = get_attribute(supply_listing, :category)
          
          Rails.logger.info("Thông tin vật tư: id=#{listing_id}, tên=#{listing_name}, SL=#{quantity}, đơn giá=#{unit_price}")
          
          # Tìm vật tư trong kho
          material = @farm_material_repository.find_by_material_id(user_id, listing_id)
          
          ActiveRecord::Base.transaction do
            if material
              # Cập nhật vật tư hiện có
              old_quantity = material.quantity.to_f
              old_unit_cost = material.unit_cost.to_f || 0
              old_total = old_quantity * old_unit_cost
              new_quantity = old_quantity + quantity
              avg_cost = new_quantity > 0 ? (old_total + total_price) / new_quantity : unit_price
              
              result = @farm_material_repository.update(material.id, {
                quantity: new_quantity,
                unit_cost: avg_cost,
                total_cost: new_quantity * avg_cost,
                last_updated: Time.current
              }, user_id)
              
              Rails.logger.info("Cập nhật vật tư #{material.id}: #{result.inspect}")
              material = result[:data] || material
            else
              # Tạo vật tư mới
              create_params = {
                name: listing_name,
                material_id: listing_id,
                quantity: quantity,
                unit: listing_unit,
                category: convert_category(listing_category),
                unit_cost: unit_price,
                total_cost: total_price,
                last_updated: Time.current
              }
              
              Rails.logger.info("Tạo vật tư mới với: #{create_params.inspect}")
              result = @farm_material_repository.create(create_params, user_id)
              
              Rails.logger.info("Kết quả tạo: #{result.inspect}")
              # FIX: Kiểm tra kết quả trả về là entity hay hash
              material = if result.is_a?(Hash) && result[:data]
                          result[:data]
                        else
                          result
                        end
              Rails.logger.info("Material sau khi tạo: #{material.inspect}")
            end
            
            # Tạo giao dịch
            transaction_params = {
              farm_material_id: material.id,
              user_id: user_id,
              quantity: quantity,
              unit_price: unit_price,
              total_price: total_price,
              transaction_type: "purchase",
              source_type: "Models::SupplyChain::SupplyOrder",
              source_id: order_id,
              notes: "Mua vật tư từ đơn hàng ##{order_id} - #{listing_name}"
            }
            
            Rails.logger.info("Tạo giao dịch với: #{transaction_params.inspect}")
            transaction_result = @transaction_repository.create_transaction(transaction_params)
            
            Rails.logger.info("Kết quả tạo giao dịch: #{transaction_result.inspect}")
          end
          
          { success: true, data: material }
        rescue => e
          Rails.logger.error("Lỗi khi cập nhật kho: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          { success: false, errors: ["Lỗi khi cập nhật kho vật tư: #{e.message}"] }
        end
      end

      def update_with_cost(id, params, user_id)
        material = @farm_material_repository.find_by_id(id, user_id)
        return { success: false, error: "Vật tư không tồn tại" } unless material
        
        ActiveRecord::Base.transaction do
          # Cập nhật material
          @farm_material_repository.update(id, params, user_id)
          
          # Tạo transaction nếu có update số lượng
          if params[:quantity].present? && params[:unit_cost].present?
            old_quantity = material.quantity
            quantity_change = params[:quantity] - old_quantity
            
            if quantity_change != 0
              @transaction_repository.create_transaction({
                farm_material_id: material.id,
                user_id: user_id,
                quantity: quantity_change,
                unit_price: params[:unit_cost],
                total_price: quantity_change * params[:unit_cost],
                transaction_type: quantity_change > 0 ? "purchase" : "adjustment",
                notes: "Cập nhật số lượng vật tư"
              })
            end
          end
        end
        
        { success: true, data: material }
      rescue => e
        { success: false, error: e.message }
      end

      def record_material_usage(activity_material, user_id)
        material = @farm_material_repository.find_by_id(activity_material.farm_material_id, user_id)
        return { success: false, error: "Vật tư không tồn tại" } unless material
        
        ActiveRecord::Base.transaction do
          # Cập nhật số lượng
          usage = activity_material.actual_quantity || activity_material.planned_quantity
          new_quantity = material.quantity - usage
          
          @farm_material_repository.update(material.id, {
            quantity: new_quantity,
            total_cost: new_quantity * material.unit_cost,
            last_updated: Time.current
          }, user_id)
          
          # Ghi nhận giao dịch sử dụng
          @transaction_repository.create_transaction({
            farm_material_id: material.id,
            user_id: user_id,
            quantity: -usage,
            unit_price: material.unit_cost,
            total_price: -usage * material.unit_cost,
            transaction_type: "consumption",
            source_type: "Models::Farming::FarmActivity",
            source_id: activity_material.farm_activity_id,
            notes: "Sử dụng vật tư cho hoạt động nông nghiệp"
          })
        end
        
        { success: true }
      rescue => e
        { success: false, error: e.message }
      end

      def find_or_create_from_order(user_id, supply_listing, order_quantity)
        begin
          ActiveRecord::Base.transaction do
            # Tìm hoặc tạo farm_material tương ứng
            farm_material = ::Models::Farming::FarmMaterial.find_or_initialize_by(
              user_id: user_id,
              name: supply_listing[:name],
              unit: supply_listing[:unit],
              category: supply_listing[:category]
            )
            
            if farm_material.new_record?
              # Nếu là vật tư mới
              farm_material.quantity = order_quantity
              farm_material.material_id = supply_listing[:id] # Lưu id của supply_listing gốc
              farm_material.last_updated = Time.current
              
              if farm_material.save
                { 
                  success: true, 
                  farm_material: @farm_material_repository.map_to_entity(farm_material), 
                  message: "Đã thêm vào kho vật tư nông trại" 
                }
              else
                raise ActiveRecord::Rollback
                { success: false, errors: farm_material.errors.full_messages }
              end
            else
              # Nếu đã có vật tư, cộng thêm số lượng
              farm_material.increment!(:quantity, order_quantity)
              farm_material.update(last_updated: Time.current)
              
              { 
                success: true, 
                farm_material: @farm_material_repository.map_to_entity(farm_material), 
                message: "Đã cập nhật kho vật tư nông trại" 
              }
            end
          end
        rescue => e
          { success: false, errors: ["Lỗi khi cập nhật kho vật tư: #{e.message}"] }
        end
      end

      private

      def convert_category(category_string)
        case category_string.to_s.downcase
        when "seed", "seeds", "hạt giống"
          "seed"
        when "fertilizer", "phân bón"
          "fertilizer"
        when "pesticide", "thuốc sâu", "thuốc bảo vệ thực vật"
          "pesticide"
        when "tool", "dụng cụ"
          "tool"
        else
          "other"
        end
      end

      def get_attribute(object, attribute)
        object.is_a?(Hash) ? object[attribute] : object.send(attribute)
      end
    end
  end
end