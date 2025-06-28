#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== TEST MATERIAL STATISTICS API ==="

# Test user ID 28 (farmer_seed_1_1748757441)
user_id = 28
user = Models::User.find(user_id)

puts "\n1. Kiểm tra user:"
puts "User ID: #{user.user_id}"
puts "User Name: #{user.user_name}"
puts "User Type: #{user.user_type}"

puts "\n2. Kiểm tra farm materials của user:"
materials = Models::Farming::FarmMaterial.where(user: user)
puts "Total materials: #{materials.count}"

materials.each do |material|
  puts "  - #{material.name} (#{material.category}): #{material.quantity} #{material.unit}"
end

puts "\n3. Kiểm tra material transactions:"
transactions = Models::Farming::FarmMaterialTransaction.where(user: user)
puts "Total transactions: #{transactions.count}"

transactions.each do |tx|
  puts "  - #{tx.farm_material.name}: #{tx.quantity} #{tx.unit} (#{tx.transaction_type}) - #{tx.total_price} VND"
end

puts "\n4. Kiểm tra activity materials:"
activity_materials = Models::Farming::ActivityMaterial.joins(:farm_activity).where(farm_activities: { user: user })
puts "Total activity materials: #{activity_materials.count}"

activity_materials.each do |am|
  puts "  - #{am.farm_material.name}: #{am.planned_quantity} #{am.unit} (Activity: #{am.farm_activity.activity_type})"
end

puts "\n5. Test API response format:"
begin
  # Tạo request context giả lập
  request = double('request')
  allow(request).to receive(:headers).and_return({})
  
  # Gọi service trực tiếp
  service = Application::Services::Farming::FarmMaterialStatisticsService.new
  stats = service.get_material_statistics(user)
  
  puts "API Response:"
  puts JSON.pretty_generate(stats)
  
  puts "\n6. Kiểm tra dữ liệu chi tiết:"
  if stats[:details]
    puts "Total details: #{stats[:details].length}"
    stats[:details].each do |detail|
      puts "  - #{detail[:name]} (#{detail[:category]}): #{detail[:quantity]} #{detail[:unit]}"
      puts "    Unit cost: #{detail[:unit_cost]}"
      puts "    Total cost: #{detail[:total_cost]}"
      puts "    Used date: #{detail[:used_date]}"
      puts "    Activity: #{detail[:activity_name]}"
      puts "    Field: #{detail[:field_name]}"
    end
  end
  
rescue => e
  puts "Error testing API: #{e.message}"
  puts e.backtrace.first(5)
end

puts "\n=== TEST COMPLETED ===" 