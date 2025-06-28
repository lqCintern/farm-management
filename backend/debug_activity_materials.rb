#!/usr/bin/env ruby

# Debug script để kiểm tra activity_materials của 2 activities
require_relative 'config/environment'

puts "=== DEBUG ACTIVITY MATERIALS ==="

# Kiểm tra Activity 251 (Gen → Preview → Save)
puts "\n🔍 Activity 251 (Gen → Preview → Save):"
activity_251 = ::Models::Farming::FarmActivity.find_by(id: 251)
if activity_251
  puts "  ID: #{activity_251.id}"
  puts "  Description: #{activity_251.description}"
  puts "  Activity Type: #{activity_251.activity_type}"
  puts "  Start Date: #{activity_251.start_date}"
  puts "  Crop ID: #{activity_251.crop_animal_id}"
  puts "  User ID: #{activity_251.user_id}"
  
  # Kiểm tra activity_materials
  activity_materials = activity_251.activity_materials.includes(:farm_material)
  puts "  Activity Materials count: #{activity_materials.count}"
  
  if activity_materials.any?
    activity_materials.each do |am|
      puts "    - #{am.farm_material.name}: #{am.planned_quantity} #{am.farm_material.unit}"
    end
  else
    puts "    - No activity_materials found"
  end
else
  puts "  ❌ Activity 251 not found"
end

# Kiểm tra Activity 256 (Apply_to_crop)
puts "\n🔍 Activity 256 (Apply_to_crop):"
activity_256 = ::Models::Farming::FarmActivity.find_by(id: 256)
if activity_256
  puts "  ID: #{activity_256.id}"
  puts "  Description: #{activity_256.description}"
  puts "  Activity Type: #{activity_256.activity_type}"
  puts "  Start Date: #{activity_256.start_date}"
  puts "  Crop ID: #{activity_256.crop_animal_id}"
  puts "  User ID: #{activity_256.user_id}"
  
  # Kiểm tra activity_materials
  activity_materials = activity_256.activity_materials.includes(:farm_material)
  puts "  Activity Materials count: #{activity_materials.count}"
  
  if activity_materials.any?
    activity_materials.each do |am|
      puts "    - #{am.farm_material.name}: #{am.planned_quantity} #{am.farm_material.unit}"
    end
  else
    puts "    - No activity_materials found"
  end
else
  puts "  ❌ Activity 256 not found"
end

# Kiểm tra chi tiết hơn về stage và template matching
puts "\n🔍 DEBUG CHI TIẾT TEMPLATE MATCHING:"

# Kiểm tra stage của activity 251
activity_251_stage = activity_251.stage if activity_251.respond_to?(:stage)
puts "  Activity 251 stage: #{activity_251_stage || 'N/A'}"

# Kiểm tra templates theo activity_type + stage
if activity_251_stage
  matching_templates = ::Models::Farming::PineappleActivityTemplate.where(
    activity_type: activity_251.activity_type,
    stage: activity_251_stage
  )
  puts "  Templates matching activity_type='#{activity_251.activity_type}' + stage='#{activity_251_stage}': #{matching_templates.count}"
  matching_templates.each do |t|
    puts "    - Template ID: #{t.id}, Name: #{t.name}, Materials: #{t.template_activity_materials.count}"
  end
else
  puts "  Activity 251 không có stage field"
end

# Kiểm tra tất cả templates cho pesticide
all_pesticide_templates = ::Models::Farming::PineappleActivityTemplate.where(activity_type: "pesticide")
puts "\n  Tất cả templates cho pesticide:"
all_pesticide_templates.each do |t|
  puts "    - Template ID: #{t.id}, Name: #{t.name}, Stage: #{t.stage}, User ID: #{t.user_id}"
end

# Kiểm tra user_id của materials
puts "\n  Kiểm tra user_id của materials:"
all_pesticide_templates.each do |template|
  template.template_activity_materials.includes(:farm_material).each do |tam|
    puts "    Template #{template.id}: Material #{tam.farm_material.name} - User ID: #{tam.farm_material.user_id}"
  end
end

# Kiểm tra crop 41
puts "\n🔍 Crop 41:"
crop = ::Models::Farming::PineappleCrop.find_by(id: 41)
if crop
  puts "  ID: #{crop.id}"
  puts "  Name: #{crop.name}"
  puts "  User ID: #{crop.user_id}"
  puts "  Planting Date: #{crop.planting_date}"
  puts "  Current Stage: #{crop.current_stage}"
  puts "  Season Type: #{crop.season_type}"
else
  puts "  ❌ Crop 41 not found"
end

puts "\n=== KẾT LUẬN ==="
puts "1. Nếu Activity 251 không có activity_materials: Logic confirm plan có vấn đề"
puts "2. Nếu Activity 256 có activity_materials: Logic apply_to_crop hoạt động đúng"
puts "3. Cần kiểm tra xem có template nào cho activity_type 'pesticide' không" 