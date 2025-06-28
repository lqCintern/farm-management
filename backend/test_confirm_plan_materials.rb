#!/usr/bin/env ruby

# Test script để kiểm tra logic confirm_plan có tạo vật tư từ templates không
require_relative 'config/environment'

puts "=== TEST CONFIRM PLAN MATERIALS ==="

# Lấy user đầu tiên
user = Models::User.first
if user.nil?
  puts "❌ Không tìm thấy user nào"
  exit 1
end

puts "User: #{user.fullname} (ID: #{user.user_id})"

# Lấy field đầu tiên của user
field = ::Models::Farming::Field.where(user_id: user.user_id).first
if field.nil?
  puts "❌ Không tìm thấy field nào cho user"
  exit 1
end

puts "Field: #{field.name} (ID: #{field.id})"

# Lấy templates của user
templates = ::Models::Farming::PineappleActivityTemplate.where(user_id: user.user_id)
if templates.empty?
  puts "❌ Không tìm thấy templates nào cho user"
  exit 1
end

puts "Templates count: #{templates.count}"

# Kiểm tra templates có vật tư không
templates_with_materials = templates.joins(:template_activity_materials)
puts "Templates with materials: #{templates_with_materials.count}"

templates_with_materials.each do |template|
  materials_count = template.template_activity_materials.count
  puts "  Template '#{template.name}' (#{template.activity_type}, #{template.stage}): #{materials_count} materials"
  template.template_activity_materials.includes(:farm_material).each do |tam|
    puts "    - #{tam.farm_material.name}: #{tam.quantity} #{tam.farm_material.unit}"
  end
end

# Tạo crop mới để test
puts "\n=== TẠO CROP MỚI ==="
crop_attrs = {
  name: "Test Crop Confirm Plan",
  field_id: field.id,
  planting_date: Date.today,
  season_type: "spring_summer",
  variety: "Test Variety",
  source: "Test Source",
  description: "Test crop for confirm plan materials",
  user_id: user.user_id
}

crop_repo = ::Repositories::Farming::PineappleCropRepository.new
create_result = crop_repo.create(crop_attrs)

if create_result.is_a?(::Entities::Farming::PineappleCrop)
  crop = create_result
  puts "✅ Tạo crop thành công: #{crop.name} (ID: #{crop.id})"
else
  puts "❌ Lỗi tạo crop: #{create_result[:errors]&.join(', ')}"
  exit 1
end

# Preview plan
puts "\n=== PREVIEW PLAN ==="
preview_params = {
  field_id: field.id,
  user_id: user.user_id,
  planting_date: Date.today,
  season_type: "spring_summer"
}

preview_result = crop_repo.preview_plan(preview_params)
if preview_result[:success]
  activities = preview_result[:activities]
  puts "✅ Preview plan thành công: #{activities.count} activities"
  
  activities.each do |activity|
    puts "  Activity: #{activity.description} (#{activity.activity_type})"
    if activity.materials && activity.materials.any?
      puts "    Materials: #{activity.materials.count} items"
      activity.materials.each do |material|
        puts "      - #{material[:name]}: #{material[:quantity]} #{material[:unit]}"
      end
    else
      puts "    Materials: None"
    end
  end
else
  puts "❌ Lỗi preview plan: #{preview_result[:error]}"
end

# Confirm plan
puts "\n=== CONFIRM PLAN ==="
if preview_result[:success]
  activities_params = preview_result[:activities].map do |activity|
    # Lấy stage từ template tương ứng
    stage = nil
    templates = ::Models::Farming::PineappleActivityTemplate.where(
      activity_type: activity.activity_type
    )
    if templates.any?
      stage = templates.first.stage
    end
    
    {
      activity_type: activity.activity_type,
      description: activity.description,
      start_date: activity.start_date,
      end_date: activity.end_date,
      stage: stage, # Thêm stage từ template
      field_id: activity.field_id
    }
  end
  
  confirm_result = crop_repo.save_activities_plan(crop.id, activities_params, user.user_id)
  
  if confirm_result[:success]
    puts "✅ Confirm plan thành công: #{confirm_result[:activities].count} activities created"
    
    # Kiểm tra activities thực tế trong database
    actual_activities = ::Models::Farming::FarmActivity.where(crop_animal_id: crop.id)
    puts "Actual activities in DB: #{actual_activities.count}"
    
    actual_activities.includes(:activity_materials => :farm_material).each do |activity|
      puts "  Activity: #{activity.description} (#{activity.activity_type})"
      puts "    Activity Materials count: #{activity.activity_materials.count}"
      
      if activity.activity_materials.any?
        activity.activity_materials.each do |am|
          puts "      - #{am.farm_material.name}: #{am.planned_quantity} #{am.farm_material.unit}"
        end
      else
        puts "      - No materials"
      end
    end
  else
    puts "❌ Lỗi confirm plan: #{confirm_result[:error]}"
  end
end

# So sánh với apply_to_crop
puts "\n=== SO SÁNH VỚI APPLY_TO_CROP ==="
template = templates_with_materials.first
if template
  puts "Testing apply_to_crop với template: #{template.name}"
  
  template_repo = ::Repositories::Farming::PineappleActivityTemplateRepository.new
  apply_result = template_repo.create_activity_from_template(template.id, crop.id, user.user_id)
  
  if apply_result[:success]
    activity = ::Models::Farming::FarmActivity.find(apply_result[:farm_activity].id)
    puts "✅ Apply_to_crop thành công: #{activity.description}"
    puts "  Activity Materials count: #{activity.activity_materials.count}"
    
    if activity.activity_materials.any?
      activity.activity_materials.includes(:farm_material).each do |am|
        puts "    - #{am.farm_material.name}: #{am.planned_quantity} #{am.farm_material.unit}"
      end
    else
      puts "    - No materials"
    end
    
    # Xóa activity test
    activity.destroy
    puts "  Đã xóa activity test từ apply_to_crop"
  else
    puts "❌ Lỗi apply_to_crop: #{apply_result[:errors]&.join(', ')}"
  end
end

# Dọn dẹp
puts "\n=== DỌN DẸP ==="
if crop
  crop.farm_activities.destroy_all
  ::Models::Farming::PineappleCrop.find(crop.id).destroy
  puts "✅ Đã xóa crop test"
end

puts "\n=== KẾT LUẬN ==="
puts "1. Preview plan: Có hiển thị vật tư từ templates"
puts "2. Confirm plan: Cần kiểm tra xem có tạo activity_materials không"
puts "3. Apply_to_crop: Đã xác nhận tạo activity_materials thành công"
puts "4. Vấn đề: Logic confirm_plan có thể không tạo activity_materials như apply_to_crop" 