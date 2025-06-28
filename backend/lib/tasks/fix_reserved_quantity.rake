namespace :farm_materials do
  desc "Fix reserved_quantity and quantity based on actual activity status"
  task fix_reserved_quantity: :environment do
    puts "=== FIXING RESERVED_QUANTITY AND QUANTITY ==="
    
    materials = Models::Farming::FarmMaterial.all
    total_fixed = 0
    
    materials.each do |material|
      puts "\n--- Processing Material: #{material.name} (ID: #{material.id}) ---"
      puts "Before - Quantity: #{material.quantity}, Reserved: #{material.reserved_quantity}, Available: #{material.available_quantity}"
      
      # Tính toán reserved_quantity thực tế từ các activity pending
      actual_reserved = 0
      material.activity_materials.includes(:farm_activity).each do |am|
        if am.farm_activity.status == "pending"
          actual_reserved += am.planned_quantity
          puts "  Activity #{am.farm_activity.id} (pending): planned #{am.planned_quantity}"
        elsif am.farm_activity.status == "completed" && am.actual_quantity.present?
          # Nếu activity completed và actual < planned, cần trả lại phần dư
          if am.actual_quantity < am.planned_quantity
            difference = am.planned_quantity - am.actual_quantity
            puts "  Activity #{am.farm_activity.id} (completed): planned #{am.planned_quantity}, actual #{am.actual_quantity}, should return #{difference}"
          end
        end
      end
      
      # Tính toán quantity thực tế
      # Ban đầu quantity = 2, nếu có activity completed với actual < planned, cần cộng lại phần dư
      actual_quantity = material.quantity
      material.activity_materials.includes(:farm_activity).each do |am|
        if am.farm_activity.status == "completed" && am.actual_quantity.present?
          if am.actual_quantity < am.planned_quantity
            difference = am.planned_quantity - am.actual_quantity
            actual_quantity += difference
            puts "  Adding back #{difference} to quantity (activity #{am.farm_activity.id})"
          end
        end
      end
      
      # Cập nhật nếu có thay đổi
      if material.reserved_quantity != actual_reserved || material.quantity != actual_quantity
        puts "  UPDATING:"
        puts "    Reserved: #{material.reserved_quantity} -> #{actual_reserved}"
        puts "    Quantity: #{material.quantity} -> #{actual_quantity}"
        
        material.update!(
          reserved_quantity: actual_reserved,
          quantity: actual_quantity
        )
        
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