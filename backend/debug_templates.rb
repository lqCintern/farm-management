#!/usr/bin/env ruby

# Debug script để kiểm tra templates và logic preview plan
require_relative 'config/environment'

puts "=== Debug Templates và Preview Plan ==="

# Kiểm tra tất cả templates
templates = Models::Farming::PineappleActivityTemplate.all
puts "\n📋 Tất cả templates (#{templates.count}):"
templates.each do |template|
  puts "  ID: #{template.id}, Activity Type: #{template.activity_type}, Stage: #{template.stage}, Name: #{template.name}, User ID: #{template.user_id}"
end

# Kiểm tra templates theo activity_type
puts "\n🔍 Templates theo activity_type:"
Models::Farming::PineappleActivityTemplate.group(:activity_type).count.each do |activity_type, count|
  puts "  #{activity_type}: #{count} templates"
end

# Kiểm tra templates theo stage
puts "\n📊 Templates theo stage:"
Models::Farming::PineappleActivityTemplate.group(:stage).count.each do |stage, count|
  puts "  #{stage || 'NULL'}: #{count} templates"
end

# Kiểm tra templates theo user
puts "\n👤 Templates theo user:"
Models::Farming::PineappleActivityTemplate.group(:user_id).count.each do |user_id, count|
  user_name = user_id ? Models::User.find_by(user_id: user_id)&.fullname : "Default"
  puts "  User #{user_id} (#{user_name}): #{count} templates"
end

# Test preview plan với params thực tế
puts "\n🧪 Test Preview Plan:"
crop_params = {
  name: "Vụ tháng 8",
  field_id: 29,
  user_id: 28, # Thêm user_id
  planting_date: "2025-01-01",
  field_area: 13451.52,
  season_type: "spring_summer",
  planting_density: 60000,
  current_stage: "preparation",
  status: "planning",
  description: "",
  variety: "Queen",
  source: ""
}

# Gọi preview_plan
repository = Services::CleanArch.farming_pineapple_crop_repository
result = repository.preview_plan(crop_params)

if result[:success]
  puts "✅ Preview plan thành công"
  puts "📝 Số activities: #{result[:activities].count}"
  result[:activities].each_with_index do |activity, index|
    puts "  Activity #{index + 1}:"
    puts "    Type: #{activity.activity_type}"
    puts "    Description: #{activity.description}"
    puts "    Start: #{activity.start_date}"
    puts "    End: #{activity.end_date}"
    puts "    Materials: #{activity.materials&.count || 0}"
  end
else
  puts "❌ Preview plan thất bại: #{result[:error]}"
end

# Kiểm tra PlanGeneratorService
puts "\n🔧 Test PlanGeneratorService:"
service = Services::Farming::PlanGeneratorService.new

# Debug: Kiểm tra templates được lấy
puts "\n🔍 Debug: Templates được lấy từ service:"
templates = service.send(:get_all_templates_for_params, crop_params)
puts "📝 Số templates: #{templates.count}"
templates.each_with_index do |template, index|
  puts "  Template #{index + 1}: #{template.name} (#{template.activity_type}) - Stage: #{template.stage}"
end

activities = service.preview_activities_for_params(crop_params)
puts "\n📝 Số activities từ service: #{activities.count}"
activities.each_with_index do |activity, index|
  puts "  Activity #{index + 1}: #{activity[:activity_type]} - #{activity[:description]}"
end

# Kiểm tra từng stage
puts "\n🎯 Kiểm tra từng stage:"
stages = Models::Farming::PineappleCrop.current_stages.keys
stages.each do |stage|
  puts "\n  Stage: #{stage}"
  
  # Templates của user cho stage này
  user_templates = Models::Farming::PineappleActivityTemplate.where(user_id: 28, stage: stage)
  puts "    User templates: #{user_templates.count}"
  user_templates.each do |t|
    puts "      - #{t.name} (#{t.activity_type})"
  end
  
  # Default templates cho stage này
  default_templates = Models::Farming::PineappleActivityTemplate.default_templates.for_stage(stage)
  puts "    Default templates: #{default_templates.count}"
  default_templates.each do |t|
    puts "      - #{t.name} (#{t.activity_type})"
  end
end

# Debug: Kiểm tra template thực tế lấy từ DB
puts "\n🔍 Debug: Tất cả template của user 28 từ DB:"
templates_db = Models::Farming::PineappleActivityTemplate.where(user_id: 28)
templates_db.each do |t|
  material_count = t.template_activity_materials.count
  puts "  Template ID: #{t.id}, Name: #{t.name}, Stage: #{t.stage}, ActivityType: #{t.activity_type}, Materials: #{material_count}"
end

# Debug: Kiểm tra template_materials của từng template được preview
puts "\n🔍 Debug: Template materials của các activity preview được tạo ra từ service:"
service = Services::Farming::PlanGeneratorService.new
templates = service.send(:get_all_templates_for_params, crop_params)
activities = service.preview_activities_for_params(crop_params)
activities.each_with_index do |activity, idx|
  template_id = activity[:template_id]
  template = templates.find { |t| t.id == template_id }
  material_count = template&.template_activity_materials&.count || 0
  puts "  Activity #{idx+1}: Template ID: #{template_id}, Name: #{template&.name}, Materials: #{material_count}"
end

# Debug chi tiết PlanGeneratorService
puts "\n🔍 Debug chi tiết PlanGeneratorService:"
service = Services::Farming::PlanGeneratorService.new

# Debug: Kiểm tra từng bước trong get_all_templates_for_params
puts "\n📋 Debug: Bước 1 - Lấy templates theo user_id:"
user_templates = Models::Farming::PineappleActivityTemplate.where(user_id: 28)
puts "  Số templates theo user_id: #{user_templates.count}"
user_templates.each do |t|
  puts "    ID: #{t.id}, Name: #{t.name}, Stage: #{t.stage}, ActivityType: #{t.activity_type}"
end

puts "\n📋 Debug: Bước 2 - Kiểm tra default templates:"
default_templates = Models::Farming::PineappleActivityTemplate.default_templates
puts "  Số default templates: #{default_templates.count}"

puts "\n📋 Debug: Bước 3 - Kiểm tra filter theo season:"
season_filtered = user_templates.to_a.select do |t|
  t.season_specific.blank? || t.season_specific == "spring_summer"
end
puts "  Số templates sau filter season: #{season_filtered.count}"
season_filtered.each do |t|
  puts "    ID: #{t.id}, Name: #{t.name}, Season: #{t.season_specific}"
end

puts "\n📋 Debug: Bước 4 - Kết quả cuối cùng từ service:"
final_templates = service.send(:get_all_templates_for_params, crop_params)
puts "  Số templates cuối cùng: #{final_templates.count}"
final_templates.each do |t|
  puts "    ID: #{t.id}, Name: #{t.name}, Stage: #{t.stage}, ActivityType: #{t.activity_type}"
end

puts "\n=== Kết thúc debug ==="

# Debug script để kiểm tra templates cho hoạt động fruit_development
puts "\n=== DEBUG TEMPLATES FOR FRUIT_DEVELOPMENT ==="

# Tìm tất cả templates cho hoạt động fruit_development
templates = Models::Farming::PineappleActivityTemplate.where(activity_type: 'fruit_development')

puts "Tìm thấy #{templates.count} templates cho hoạt động fruit_development:"
puts

templates.each do |template|
  puts "Template ID: #{template.id}"
  puts "  Name: #{template.name}"
  puts "  Stage: #{template.stage}"
  puts "  User ID: #{template.user_id || 'Default'}"
  puts "  Materials count: #{template.template_activity_materials.count}"
  
  if template.template_activity_materials.any?
    puts "  Materials:"
    template.template_activity_materials.includes(:farm_material).each do |tam|
      puts "    - #{tam.farm_material.name}: #{tam.quantity} #{tam.farm_material.unit}"
    end
  else
    puts "  WARNING: Không có vật tư nào!"
  end
  puts
end

# Kiểm tra user có vật tư gì
user_id = 28 # Thay đổi user_id nếu cần
puts "=== USER MATERIALS (User ID: #{user_id}) ==="
user_materials = Models::Farming::FarmMaterial.where(user_id: user_id)
puts "User có #{user_materials.count} vật tư:"

user_materials.each do |material|
  puts "  - #{material.name}: #{material.available_quantity} #{material.unit} (available)"
end

puts
puts "=== TEST CREATE ACTIVITY FROM TEMPLATE ==="

# Test tạo hoạt động từ template
if templates.any?
  template = templates.first
  crop = Models::Farming::PineappleCrop.where(user_id: user_id).first
  
  if crop
    puts "Testing với template ID: #{template.id}, crop ID: #{crop.id}"
    
    template_repo = Repositories::Farming::PineappleActivityTemplateRepository.new
    result = template_repo.create_activity_from_template(template.id, crop.id, user_id)
    
    if result[:success]
      puts "✅ Tạo hoạt động thành công!"
      activity = Models::Farming::FarmActivity.find(result[:farm_activity].id)
      puts "  Activity ID: #{activity.id}"
      puts "  Materials count: #{activity.activity_materials.count}"
      
      if activity.activity_materials.any?
        puts "  Activity Materials:"
        activity.activity_materials.includes(:farm_material).each do |am|
          puts "    - #{am.farm_material.name}: #{am.planned_quantity} #{am.farm_material.unit}"
        end
      end
      
      # Xóa activity test
      activity.destroy
      puts "  Đã xóa activity test"
    else
      puts "❌ Lỗi: #{result[:errors]&.join(', ')}"
    end
  else
    puts "Không tìm thấy crop cho user #{user_id}"
  end
else
  puts "Không có template nào để test"
end 