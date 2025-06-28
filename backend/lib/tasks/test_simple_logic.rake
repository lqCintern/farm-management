namespace :farm_materials do
  desc "Test simple material logic with specific activity"
  task test_simple_logic: :environment do
    puts "=== TESTING SIMPLE MATERIAL LOGIC ==="
    
    # Tìm một activity pending có material
    activity = Models::Farming::FarmActivity.joins(:activity_materials)
                                          .where(status: "pending")
                                          .first
    
    if activity.nil?
      puts "No pending activities found"
      return
    end
    
    puts "\n--- Testing Activity: #{activity.description} (ID: #{activity.id}) ---"
    puts "Status: #{activity.status}"
    
    # Hiển thị materials
    activity.activity_materials.each do |am|
      material = am.farm_material
      puts "\nMaterial: #{material.name} (ID: #{material.id})"
      puts "  Quantity: #{material.quantity}"
      puts "  Reserved: #{material.reserved_quantity}"
      puts "  Available: #{material.available_quantity}"
      puts "  Planned: #{am.planned_quantity}"
      puts "  Actual: #{am.actual_quantity}"
    end
    
    # Test với actual < planned
    puts "\n--- Testing Actual < Planned ---"
    activity_material = activity.activity_materials.first
    material = activity_material.farm_material
    planned = activity_material.planned_quantity
    actual = planned * 0.8
    
    puts "Planned: #{planned}, Actual: #{actual}"
    puts "Before - Quantity: #{material.quantity}, Reserved: #{material.reserved_quantity}"
    
    # Test complete
    actual_materials = { material.id.to_s => actual }
    result = activity.complete_activity(actual_materials)
    
    if result
      puts "✓ Success!"
      material.reload
      puts "After - Quantity: #{material.quantity}, Reserved: #{material.reserved_quantity}"
      
      # Kiểm tra logic
      expected_quantity = material.quantity + actual
      puts "Expected quantity: #{expected_quantity}"
      puts "Logic check: #{material.quantity == expected_quantity ? '✓' : '✗'}"
    else
      puts "✗ Failed: #{activity.errors.full_messages.join(', ')}"
    end
  end
end 