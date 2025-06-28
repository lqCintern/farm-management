namespace :farm_materials do
  desc "Debug material quantity changes"
  task debug_material: :environment do
    material = Models::Farming::FarmMaterial.find(2)
    puts "=== DEBUG MATERIAL ==="
    puts "Material: #{material.name}"
    puts "Initial - Quantity: #{material.quantity}, Reserved: #{material.reserved_quantity}, Available: #{material.available_quantity}"
    
    # Test return_quantity with more detail
    puts "\n--- Testing return_quantity ---"
    old_quantity = material.quantity
    puts "Before: quantity = #{old_quantity}"
    
    # Try direct update first
    result = material.update(quantity: old_quantity + 0.9)
    puts "Direct update result: #{result}"
    puts "Errors: #{material.errors.full_messages}" if material.errors.any?
    material.reload
    puts "After direct update: quantity = #{material.quantity}"
    
    # Reset to original
    material.update(quantity: old_quantity)
    material.reload
    
    # Try return_quantity method
    puts "\nTrying return_quantity method:"
    result = material.return_quantity(0.9)
    puts "return_quantity result: #{result}"
    puts "Errors: #{material.errors.full_messages}" if material.errors.any?
    material.reload
    puts "After return_quantity: quantity = #{material.quantity}"
    
    # Test release_reserved_quantity
    puts "\n--- Testing release_reserved_quantity ---"
    old_reserved = material.reserved_quantity
    material.release_reserved_quantity(1.0)
    material.reload
    puts "After release_reserved_quantity(1.0):"
    puts "  Quantity: #{material.quantity}"
    puts "  Reserved: #{material.reserved_quantity} (was #{old_reserved})"
    puts "  Available: #{material.available_quantity}"
  end
end

namespace :debug do
  desc "Debug material usage data"
  task material_usage: :environment do
    puts "=== Debug Material Usage Data ==="
    
    # Kiểm tra ActivityMaterial
    activity_materials = ::Models::Farming::ActivityMaterial.all
    puts "Total ActivityMaterial records: #{activity_materials.count}"
    
    if activity_materials.any?
      puts "\nFirst 5 ActivityMaterial records:"
      activity_materials.limit(5).each do |am|
        puts "- ID: #{am.id}, FarmActivity: #{am.farm_activity_id}, FarmMaterial: #{am.farm_material_id}"
        puts "  Planned: #{am.planned_quantity}, Actual: #{am.actual_quantity}"
      end
    end
    
    # Kiểm tra FarmActivity
    farm_activities = ::Models::Farming::FarmActivity.all
    puts "\nTotal FarmActivity records: #{farm_activities.count}"
    
    if farm_activities.any?
      puts "\nFirst 5 FarmActivity records:"
      farm_activities.limit(5).each do |fa|
        puts "- ID: #{fa.id}, Description: #{fa.description}, Field: #{fa.field_id}, Start: #{fa.start_date}"
      end
    end
    
    # Kiểm tra Fields
    fields = ::Models::Farming::Field.all
    puts "\nTotal Field records: #{fields.count}"
    
    if fields.any?
      puts "\nFirst 5 Field records:"
      fields.limit(5).each do |field|
        puts "- ID: #{field.id}, Name: #{field.name}"
      end
    end
    
    # Test join query
    puts "\n=== Testing Join Query ==="
    test_query = ::Models::Farming::ActivityMaterial
      .joins(:farm_activity)
      .joins("LEFT JOIN fields ON farm_activities.field_id = fields.id")
      .select("activity_materials.id, 
              activity_materials.farm_activity_id,
              activity_materials.farm_material_id,
              farm_activities.start_date as used_date,
              farm_activities.description as activity_name,
              fields.name as field_name")
      .limit(5)
    
    puts "Join query result count: #{test_query.length}"
    
    test_query.each do |result|
      puts "- ActivityMaterial ID: #{result.id}"
      puts "  Used Date: #{result.used_date}"
      puts "  Activity Name: #{result.activity_name}"
      puts "  Field Name: #{result.field_name}"
    end
  end
end 