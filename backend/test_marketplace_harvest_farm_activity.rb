#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

# Script test để kiểm tra logic tạo FarmActivity từ MarketplaceHarvest
# Chạy: rails runner test_marketplace_harvest_farm_activity.rb

puts "=== Test tạo FarmActivity từ MarketplaceHarvest ==="

# Tìm một product_listing có crop_animal_id và field_id
product_listing = Models::Marketplace::ProductListing.joins(:pineapple_crop).where.not(pineapple_crops: { field_id: nil }).first

if product_listing.nil?
  puts "❌ Không tìm thấy product_listing nào có crop_animal_id và field_id"
  exit 1
end

puts "✅ Tìm thấy product_listing: #{product_listing.title}"
puts "   - Crop ID: #{product_listing.crop_animal_id}"
puts "   - Field ID: #{product_listing.pineapple_crop.field_id}"

# Tìm một trader
trader = Models::User.where(user_type: 'trader').first
if trader.nil?
  puts "❌ Không tìm thấy trader nào"
  exit 1
end

puts "✅ Tìm thấy trader: #{trader.fullname}"

# Tạo marketplace harvest
harvest = Models::Marketplace::MarketplaceHarvest.new(
  product_listing_id: product_listing.id,
  trader_id: trader.user_id,
  scheduled_date: Time.current + 1.day,
  location: "Khu vực thu hoạch",
  estimated_quantity: 100,
  actual_quantity: 95,
  status: "scheduled"
)

puts "\n=== Tạo MarketplaceHarvest ==="
puts "   - Product Listing: #{harvest.product_listing.title}"
puts "   - Trader: #{harvest.trader.fullname}"
puts "   - Scheduled Date: #{harvest.scheduled_date}"
puts "   - Location: #{harvest.location}"

if harvest.save
  puts "✅ Tạo MarketplaceHarvest thành công (ID: #{harvest.id})"
  
  # Kiểm tra FarmActivity được tạo
  if harvest.farm_activity.present?
    activity = harvest.farm_activity
    puts "✅ FarmActivity được tạo thành công:"
    puts "   - ID: #{activity.id}"
    puts "   - Activity Type: #{activity.activity_type}"
    puts "   - Description: #{activity.description}"
    puts "   - Status: #{activity.status}"
    puts "   - Start Date: #{activity.start_date}"
    puts "   - Field: #{activity.field.name}"
    puts "   - Crop: #{activity.pineapple_crop.name}"
  else
    puts "❌ FarmActivity không được tạo"
  end
  
  # Test sync status
  puts "\n=== Test sync status ==="
  harvest.update(status: "harvesting")
  puts "   - MarketplaceHarvest status: #{harvest.status}"
  puts "   - FarmActivity status: #{harvest.farm_activity.status}"
  
  harvest.update(status: "completed")
  puts "   - MarketplaceHarvest status: #{harvest.status}"
  puts "   - FarmActivity status: #{harvest.farm_activity.status}"
  
  # Cleanup
  harvest.destroy
  puts "\n✅ Cleanup completed"
else
  puts "❌ Tạo MarketplaceHarvest thất bại: #{harvest.errors.full_messages.join(', ')}"
end

puts "\n=== Test hoàn thành ===" 