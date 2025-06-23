module Services::SupplyChain
  class FarmMaterialService
    def update_from_order(order)
      user_id = order.buyer[:id]
      supply = order.supply_listing

      # Find or initialize farm material for this user
      farm_material = ::Models::Farming::FarmMaterial.find_or_initialize_by(
        user_id: user_id,
        name: supply[:name],
        unit: supply[:unit],
        category: supply[:category]
      )

      ActiveRecord::Base.transaction do
        if farm_material.new_record?
          # Create new farm material
          farm_material.quantity = order.quantity
          farm_material.material_id = supply[:id]
          farm_material.last_updated = Time.current
          farm_material.save!
        else
          # Update existing farm material
          farm_material.increment!(:quantity, order.quantity)
          farm_material.update!(last_updated: Time.current)
        end

        # Log activity
        ::ActivityLog.create!(
          user_id: user_id,
          action_type: "complete_order",
          target_type: "SupplyOrder",
          target_id: order.id,
          details: {
            quantity: order.quantity,
            product_name: supply[:name]
          }
        )
      end

      true
    rescue => e
      Rails.logger.error("Error updating farm materials: #{e.message}")
      false
    end
  end
end
