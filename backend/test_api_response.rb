#!/usr/bin/env ruby

# Script test API response của pineapple crops
require_relative 'config/environment'

puts "=== Test API Response của Pineapple Crops ==="

# Tìm user
user = Models::User.first
if user.nil?
  puts "❌ Không tìm thấy user nào"
  exit 1
end

puts "👤 User: #{user.email}"

# Test presenter
puts "\n📋 Test Presenter:"
crops = Models::Farming::PineappleCrop.where(user_id: user.user_id).limit(3)
crops.each do |crop|
  puts "Crop ID: #{crop.id}, Name: #{crop.name}"
  puts "  field_area trong DB: #{crop.field_area}"
  
  # Test presenter
  presenter = Presenters::Farming::PineappleCropPresenter.new(crop)
  json_response = presenter.as_json
  puts "  field_area trong presenter: #{json_response[:field_area]}"
  puts "  ---"
end

# Test repository mapping
puts "\n🗂️ Test Repository Mapping:"
repo = Repositories::Farming::PineappleCropRepository.new
crops.each do |crop|
  entity = repo.map_to_entity(crop)
  puts "Crop ID: #{crop.id}, Name: #{crop.name}"
  puts "  field_area trong entity: #{entity.field_area}"
  puts "  ---"
end

# Test collection presenter
puts "\n📦 Test Collection Presenter:"
collection_response = Presenters::Farming::PineappleCropPresenter.present_collection(crops)
puts "Collection response keys: #{collection_response.keys}"
puts "Items count: #{collection_response[:items]&.length || 0}"

if collection_response[:items]&.any?
  first_item = collection_response[:items].first
  puts "First item field_area: #{first_item[:field_area]}"
  puts "First item keys: #{first_item.keys}"
end

puts "\n=== Kết thúc test ===" 