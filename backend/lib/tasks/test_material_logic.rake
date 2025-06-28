namespace :farm_materials do
  desc "Test complete material logic flow with different scenarios"
  task test_material_logic: :environment do
    puts "=== TESTING COMPLETE MATERIAL LOGIC FLOW ==="
    
    # Lặp qua một số vật tư để test
    Models::Farming::FarmMaterial.limit(5).each do |material|
      puts "\n--- Testing with Material: #{material.name} (ID: #{material.id}) ---"
      puts "Initial state:"
      puts "  Quantity: #{material.quantity}"
      puts "  Reserved: #{material.reserved_quantity}"
      puts "  Available: #{material.available_quantity}"
      
      # Lấy một pending activity để test
      pending_activity = material.farm_activities.where(status: "pending").first
      if pending_activity.nil?
        puts "  No pending activities found for this material"
        next
      end
      
      puts "\n--- Testing with Activity: #{pending_activity.description} (ID: #{pending_activity.id}) ---"
      puts "Activity status: #{pending_activity.status}"
      
      # Hiển thị activity materials
      pending_activity.activity_materials.each do |am|
        puts "  Activity Material:"
        puts "    Planned: #{am.planned_quantity}"
        puts "    Actual: #{am.actual_quantity}"
      end
      
      # Test các trường hợp khác nhau
      test_cases = [
        { name: "Actual < Planned", actual: 0.5 },
        { name: "Actual = Planned", actual: 1.0 },
        { name: "Actual > Planned", actual: 1.5 }
      ]
      
      test_cases.each do |test_case|
        puts "\n--- Testing: #{test_case[:name]} ---"
        
        # Tạo actual_materials data
        actual_materials = {}
        pending_activity.activity_materials.each do |am|
          actual_materials[am.farm_material_id] = am.planned_quantity * test_case[:actual]
        end
        
        puts "Actual materials to use: #{actual_materials}"
        
        # Lưu trạng thái trước khi test
        before_quantity = material.quantity
        before_reserved = material.reserved_quantity
        before_available = material.available_quantity
        
        # Thực hiện complete
        result = pending_activity.complete_activity(actual_materials)
        
        if result
          puts "✓ Activity completed successfully"
          
          # Reload material
          material.reload
          
          puts "After completion:"
          puts "  Quantity: #{material.quantity} (was #{before_quantity})"
          puts "  Reserved: #{material.reserved_quantity} (was #{before_reserved})"
          puts "  Available: #{material.available_quantity} (was #{before_available})"
          
          # Kiểm tra logic
          puts "--- Logic Verification ---"
          
          # Kiểm tra activity status
          pending_activity.reload
          puts "Activity status: #{pending_activity.status}"
          
          # Kiểm tra activity materials
          pending_activity.activity_materials.each do |am|
            puts "Activity Material:"
            puts "  Planned: #{am.planned_quantity}"
            puts "  Actual: #{am.actual_quantity}"
          end
          
          # Tính toán expected values
          total_actual_used = pending_activity.activity_materials.sum(&:actual_quantity)
          puts "Total actual used: #{total_actual_used}"
          
          # Kiểm tra quantity calculation
          expected_quantity = before_quantity - total_actual_used
          puts "Expected quantity: #{expected_quantity}"
          puts "Actual quantity: #{material.quantity}"
          puts "Quantity match: #{expected_quantity == material.quantity ? '✓' : '✗'}"
          
          # Kiểm tra reserved quantity (should be 0 after completion)
          puts "Reserved after completion: #{material.reserved_quantity} (should be 0)"
          puts "Reserved check: #{material.reserved_quantity == 0 ? '✓' : '✗'}"
          
          # Reset activity để test tiếp
          pending_activity.update!(status: "pending")
          material.reload
          
        else
          puts "✗ Activity completion failed"
          puts "Errors: #{pending_activity.errors.full_messages.join(', ')}"
          
          # Reset activity để test tiếp
          pending_activity.update!(status: "pending")
          material.reload
        end
      end
    end
    
    puts "\n=== TEST COMPLETED ==="
  end
end 