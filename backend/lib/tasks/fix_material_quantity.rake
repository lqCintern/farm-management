namespace :farm_materials do
  desc "Fix material quantity and reserved_quantity based on transactions and activities"
  task fix_material_quantity: :environment do
    puts "=== FIXING MATERIAL QUANTITY AND RESERVED_QUANTITY ==="
    
    materials = Models::Farming::FarmMaterial.all
    total_fixed = 0
    
    materials.each do |material|
      puts "\n--- Processing Material: #{material.name} (ID: #{material.id}) ---"
      puts "Before - Quantity: #{material.quantity}, Reserved: #{material.reserved_quantity}, Available: #{material.available_quantity}"
      
      # Tính tổng mua vào từ bảng transactions
      total_purchased = Models::Farming::FarmMaterialTransaction.where(farm_material_id: material.id, transaction_type: ["purchase", "adjustment"]).sum(:quantity)
      
      # Tính tổng đã dùng (actual_quantity của các activity completed)
      total_used = 0
      material.activity_materials.includes(:farm_activity).each do |am|
        if am.farm_activity.status == "completed" && am.actual_quantity.present?
          total_used += am.actual_quantity.to_f
        end
      end
      
      # Tính reserved (pending activities)
      actual_reserved = 0
      material.activity_materials.includes(:farm_activity).each do |am|
        if am.farm_activity.status == "pending"
          actual_reserved += am.planned_quantity.to_f
        end
      end
      
      # Tính lại quantity: tổng mua vào - tổng actual đã dùng
      actual_quantity = total_purchased - total_used
      
      puts "  Total purchased: #{total_purchased}"
      puts "  Total used (completed with actual): #{total_used}"
      puts "  Actual quantity should be: #{actual_quantity}"
      puts "  Actual reserved should be: #{actual_reserved}"
      
      # Update nếu cần
      needs_update = false
      updates = {}
      
      if material.quantity != actual_quantity
        updates[:quantity] = actual_quantity
        needs_update = true
      end
      
      if material.reserved_quantity != actual_reserved
        updates[:reserved_quantity] = actual_reserved
        needs_update = true
      end
      
      if needs_update
        puts "  UPDATING:"
        puts "    Quantity: #{material.quantity} -> #{actual_quantity}"
        puts "    Reserved: #{material.reserved_quantity} -> #{actual_reserved}"
        
        material.update!(updates)
        material.reload
        
        puts "  After - Quantity: #{material.quantity}, Reserved: #{material.reserved_quantity}, Available: #{material.available_quantity}"
        total_fixed += 1
      else
        puts "  No changes needed"
      end
    end
    
    puts "\n=== SUMMARY ==="
    puts "Total materials processed: #{materials.count}"
    puts "Total materials fixed: #{total_fixed}"
    puts "Fix completed!"
  end
end 