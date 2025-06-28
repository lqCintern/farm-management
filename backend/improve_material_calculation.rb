#!/usr/bin/env ruby

# Script để cải thiện logic tính toán vật tư theo diện tích
# Chạy: ruby improve_material_calculation.rb

require_relative 'config/environment'

puts "🔧 Cải thiện logic tính toán vật tư theo diện tích"
puts "=" * 60

# 1. Kiểm tra templates hiện tại
puts "\n📋 Kiểm tra templates hiện tại:"
templates = Models::Farming::PineappleActivityTemplate.includes(:template_activity_materials => :farm_material)

templates.each do |template|
  puts "  Template: #{template.name} (#{template.activity_type}) - Stage: #{template.stage}"
  
  if template.template_activity_materials.any?
    template.template_activity_materials.each do |tam|
      puts "    - #{tam.farm_material.name}: #{tam.quantity} #{tam.farm_material.unit}"
    end
  else
    puts "    - Không có vật tư"
  end
end

# 2. Đề xuất cải thiện logic merge materials
puts "\n💡 Đề xuất cải thiện logic merge materials:"

puts "  Vấn đề hiện tại:"
puts "    - Merge đơn giản bằng cách cộng dồn số lượng"
puts "    - Không tính đến diện tích cánh đồng"
puts "    - Có thể dẫn đến số lượng vật tư quá cao"

puts "\n  Giải pháp đề xuất:"
puts "    1. Template nên định nghĩa vật tư theo đơn vị/ha"
puts "    2. Khi generate plan, nhân với diện tích thực tế"
puts "    3. Thêm logic ưu tiên template thay vì merge tất cả"
puts "    4. Thêm validation để tránh trùng lặp vật tư"

# 3. Kiểm tra fields và diện tích
puts "\n🌾 Kiểm tra fields và diện tích:"
fields = Models::Farming::Field.all

fields.each do |field|
  puts "  Field: #{field.name}"
  puts "    - Diện tích: #{field.area&.to_f&.round(2)} m²"
  puts "    - Diện tích (ha): #{(field.area&.to_f || 0) / 10000} ha"
  
  if field.pineapple_crops.any?
    field.pineapple_crops.each do |crop|
      puts "    - Crop: #{crop.name} (ID: #{crop.id})"
    end
  else
    puts "    - Chưa có crop nào"
  end
end

# 4. Đề xuất cải thiện code
puts "\n🔧 Đề xuất cải thiện code:"

puts "  Backend - PineappleCropRepository:"
puts "    - Thêm method calculate_materials_by_area(template_materials, field_area)"
puts "    - Cải thiện logic merge để tránh trùng lặp"
puts "    - Thêm validation cho số lượng vật tư"

puts "\n  Frontend - PineappleCropForm:"
puts "    - Hiển thị diện tích cánh đồng trong preview"
puts "    - Thêm modal chi tiết activity với vật tư"
puts "    - Hiển thị số lượng vật tư đã tính theo diện tích"

# 5. Tạo method mẫu để tính toán vật tư theo diện tích
puts "\n📝 Method mẫu để tính toán vật tư theo diện tích:"

sample_code = <<~RUBY
  def calculate_materials_by_area(template_materials, field_area_ha)
    # field_area_ha: diện tích cánh đồng tính bằng ha
    calculated_materials = {}
    
    template_materials.each do |template_material|
      material_id = template_material.farm_material_id
      base_quantity = template_material.quantity # Số lượng cho 1 ha
      
      # Tính số lượng thực tế theo diện tích
      actual_quantity = base_quantity * field_area_ha
      
      if calculated_materials[material_id]
        # Nếu đã có vật tư này, cộng dồn (có thể từ nhiều template)
        calculated_materials[material_id][:quantity] += actual_quantity
      else
        calculated_materials[material_id] = {
          material_id: material_id,
          quantity: actual_quantity,
          unit: template_material.farm_material.unit,
          name: template_material.farm_material.name
        }
      end
    end
    
    calculated_materials.values
  end
RUBY

puts sample_code

# 6. Kiểm tra logic merge hiện tại
puts "\n🔍 Kiểm tra logic merge hiện tại trong preview_plan:"

preview_code = <<~RUBY
  # Logic hiện tại trong preview_plan:
  templates.each do |template|
    template_materials = template.template_activity_materials.includes(:farm_material).map do |tam|
      {
        id: tam.farm_material.id,
        name: tam.farm_material.name,
        quantity: tam.quantity, # ← Đây là số lượng cố định, không tính theo diện tích
        unit: tam.farm_material.unit,
        template_id: template.id,
        template_name: template.name
      }
    end
    materials.concat(template_materials) # ← Cộng dồn tất cả
  end
RUBY

puts preview_code

puts "\n❌ Vấn đề:"
puts "  - quantity không được nhân với diện tích cánh đồng"
puts "  - Không có logic để tránh trùng lặp vật tư"
puts "  - Không có validation cho số lượng hợp lý"

puts "\n✅ Giải pháp:"
puts "  1. Thay đổi logic để tính quantity theo diện tích"
puts "  2. Thêm logic merge thông minh để tránh trùng lặp"
puts "  3. Thêm validation cho số lượng vật tư"
puts "  4. Hiển thị rõ ràng trong UI rằng số lượng đã được tính theo diện tích"

puts "\n🎯 Kết luận:"
puts "  - Logic merge hiện tại có thể gây sai sót khi có nhiều templates"
puts "  - Cần cải thiện để tính toán theo diện tích thực tế"
puts "  - Frontend đã được cải thiện để hiển thị chi tiết hơn"
puts "  - Backend cần được cập nhật để tính toán chính xác hơn"

puts "\n" + "=" * 60
puts "✅ Script hoàn thành!" 