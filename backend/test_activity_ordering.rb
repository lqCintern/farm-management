#!/usr/bin/env ruby

# Test script để kiểm tra việc sắp xếp activities theo thời gian
require_relative 'config/environment'

puts "=== TEST SẮP XẾP ACTIVITIES THEO THỜI GIAN ==="

# Tìm một pineapple crop có activities
crop = ::Models::Farming::PineappleCrop.includes(:farm_activities).first
unless crop
  puts "❌ Không tìm thấy pineapple crop nào"
  exit 1
end

puts "🔍 Kiểm tra crop: #{crop.name} (ID: #{crop.id})"

# Lấy activities theo thứ tự ID (cũ)
activities_by_id = crop.farm_activities.order(:id).to_a
puts "\n📋 Activities theo thứ tự ID:"
activities_by_id.each_with_index do |activity, index|
  puts "  #{index + 1}. ID: #{activity.id} | #{activity.description} | #{activity.start_date} | #{activity.activity_type}"
end

# Lấy activities theo thứ tự start_date (mới)
activities_by_date = crop.farm_activities.order(:start_date).to_a
puts "\n📅 Activities theo thứ tự start_date:"
activities_by_date.each_with_index do |activity, index|
  puts "  #{index + 1}. ID: #{activity.id} | #{activity.description} | #{activity.start_date} | #{activity.activity_type}"
end

# So sánh thứ tự
puts "\n🔍 So sánh thứ tự:"
if activities_by_id.map(&:id) == activities_by_date.map(&:id)
  puts "✅ Thứ tự giống nhau - activities đã được sắp xếp theo thời gian"
else
  puts "❌ Thứ tự khác nhau - cần kiểm tra lại logic sắp xếp"
  
  puts "\n📊 Chi tiết so sánh:"
  puts "Theo ID:     #{activities_by_id.map(&:id).join(' -> ')}"
  puts "Theo Date:   #{activities_by_date.map(&:id).join(' -> ')}"
end

# Test repository method
puts "\n🧪 Test repository method:"
repo = ::Repositories::Farming::PineappleCropRepository.new
entity = repo.find_with_activities(crop.id)

if entity && entity.farm_activities
  puts "✅ Repository trả về #{entity.farm_activities.count} activities"
  
  # Kiểm tra thứ tự trong entity
  entity_activity_ids = entity.farm_activities.map(&:id)
  db_activity_ids = activities_by_date.map(&:id)
  
  if entity_activity_ids == db_activity_ids
    puts "✅ Repository sắp xếp đúng theo start_date"
  else
    puts "❌ Repository sắp xếp sai"
    puts "Repository: #{entity_activity_ids.join(' -> ')}"
    puts "Database:   #{db_activity_ids.join(' -> ')}"
  end
else
  puts "❌ Repository không trả về activities"
end

# Test service method
puts "\n🧪 Test service method:"
service = ::Services::Farming::PineappleCropService.new(crop, crop.user)
preview_activities = service.preview_plan({
  name: crop.name,
  field_id: crop.field_id,
  planting_date: crop.planting_date,
  season_type: crop.season_type,
  current_stage: crop.current_stage
})

if preview_activities.any?
  puts "✅ Service preview trả về #{preview_activities.count} activities"
  
  # Kiểm tra thứ tự trong preview
  preview_dates = preview_activities.map(&:start_date)
  is_sorted = preview_dates.each_cons(2).all? { |a, b| a <= b }
  
  if is_sorted
    puts "✅ Service preview sắp xếp đúng theo start_date"
  else
    puts "❌ Service preview sắp xếp sai"
    preview_activities.each_with_index do |activity, index|
      puts "  #{index + 1}. #{activity.start_date} | #{activity.description}"
    end
  end
else
  puts "❌ Service preview không trả về activities"
end

puts "\n=== KẾT THÚC TEST ===" 