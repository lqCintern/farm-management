#!/usr/bin/env ruby

# Script test apply template với tính toán vật tư theo diện tích
require_relative 'config/environment'

puts "=== Test Apply Template với Tính toán Vật tư theo Diện tích ==="

# Tìm user và crop để test
user = User.first
if user.nil?
  puts "❌ Không tìm thấy user nào"
  exit 1
end

puts "👤 User: #{user.email}"

# Tìm crop có diện tích
crop = user.pineapple_crops.joins(:field).where.not(fields: { area: nil }).first
if crop.nil?
  puts "❌ Không tìm thấy crop nào có diện tích"
  exit 1
end

field = crop.field
field_area_ha = field.area / 10000.0

puts "🌾 Crop: #{crop.name || "Crop ##{crop.id}"}"
puts "📍 Field: #{field.name}"
puts "📏 Diện tích: #{field.area.to_i} m² (#{field_area_ha.round(4)} ha)"

# Tìm template có materials
template = user.pineapple_activity_templates.joins(:materials).first
if template.nil?
  # Tìm default template có materials
  template = PineappleActivityTemplate.joins(:materials).where(user_id: nil).first
end

if template.nil?
  puts "❌ Không tìm thấy template nào có materials"
  exit 1
end

puts "📋 Template: #{template.name}"
puts "🏷️ Stage: #{template.stage}"
puts "🔧 Activity Type: #{template.activity_type}"

# Hiển thị materials của template
puts "\n📦 Materials trong template:"
template.materials.each do |material|
  puts "  - #{material.name}: #{material.quantity} #{material.unit}/ha"
end

# Test apply template
puts "\n🚀 Test apply template..."
begin
  service = Services::CleanArch.farming_apply_template_to_activities
  result = service.execute(template.id, crop.id, user.user_id)
  
  if result[:success]
    activity = result[:farm_activity]
    puts "✅ Apply template thành công!"
    puts "📝 Activity ID: #{activity.id}"
    puts "📅 Start Date: #{activity.start_date}"
    puts "📅 End Date: #{activity.end_date}"
    
    # Hiển thị materials của activity
    if activity.materials && activity.materials.any?
      puts "\n📦 Materials của activity (đã tính theo diện tích):"
      activity.materials.each do |material|
        puts "  - #{material.name}: #{material.quantity} #{material.unit}"
        if material.base_quantity_per_ha
          puts "    (Chuẩn: #{material.base_quantity_per_ha} #{material.unit}/ha)"
        end
        if material.field_area_ha
          puts "    (Diện tích: #{material.field_area_ha.round(4)} ha)"
        end
      end
    else
      puts "⚠️ Activity không có materials"
    end
    
    # Kiểm tra tính toán
    puts "\n🧮 Kiểm tra tính toán:"
    template.materials.each do |template_material|
      activity_material = activity.materials&.find { |m| m.name == template_material.name }
      if activity_material
        expected_quantity = (template_material.quantity * field_area_ha).ceil
        puts "  #{template_material.name}:"
        puts "    Template: #{template_material.quantity} #{template_material.unit}/ha"
        puts "    Diện tích: #{field_area_ha.round(4)} ha"
        puts "    Tính toán: #{template_material.quantity} × #{field_area_ha.round(4)} = #{template_material.quantity * field_area_ha}"
        puts "    Làm tròn lên: #{expected_quantity}"
        puts "    Thực tế: #{activity_material.quantity}"
        puts "    ✅ Đúng" if activity_material.quantity == expected_quantity
        puts "    ❌ Sai" if activity_material.quantity != expected_quantity
      end
    end
    
  else
    puts "❌ Apply template thất bại: #{result[:error]}"
  end
  
rescue => e
  puts "❌ Lỗi: #{e.message}"
  puts e.backtrace.first(5)
end

puts "\n=== Kết thúc test ===" 