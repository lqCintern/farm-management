#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "=== Debug Order Completion with MarketplaceHarvest ==="

# Tìm một đơn hàng có status 'accepted'
order = Models::Marketplace::ProductOrder.where(status: 'accepted').first

if order.nil?
  puts "❌ Không tìm thấy đơn hàng nào có status 'accepted'"
  puts "Các đơn hàng hiện có:"
  Models::Marketplace::ProductOrder.all.each do |o|
    puts "  - ID: #{o.id}, Status: #{o.status}"
  end
  exit 1
end

puts "✅ Tìm thấy đơn hàng:"
puts "  - ID: #{order.id}"
puts "  - Status: #{order.status}"
puts "  - Product Listing ID: #{order.product_listing_id}"
puts "  - Buyer ID: #{order.buyer_id}"

# Tìm product listing
product_listing = Models::Marketplace::ProductListing.find_by(id: order.product_listing_id)
puts "  - Seller ID: #{product_listing&.user_id}"

# Kiểm tra MarketplaceHarvest hiện tại
puts "\n=== Checking existing MarketplaceHarvests ==="
existing_harvests = Models::Marketplace::MarketplaceHarvest.where(product_order_id: order.id)
puts "  - Existing harvests for order #{order.id}: #{existing_harvests.count}"

# Test trực tiếp method create_from_order
puts "\n=== Testing create_from_order directly ==="
begin
  harvest_service = Services::CleanArch.marketplace_create_harvest
  result = harvest_service.create_from_order(order)
  puts "  - Direct create_from_order result: #{result}"
rescue => e
  puts "❌ Exception in create_from_order: #{e.message}"
  puts e.backtrace.first(5)
end

# Test với seller
puts "\n=== Testing with Seller (ID: #{product_listing&.user_id}) ==="
begin
  use_case = UseCases::Marketplace::ProductOrders::UpdateOrderStatus.new(
    Repositories::Marketplace::ProductOrderRepository.new,
    Repositories::Marketplace::ProductListingRepository.new,
    nil,
    Services::CleanArch.notification_service,
    nil,
    Services::CleanArch.marketplace_create_harvest
  )
  
  result = use_case.execute(order.id, "complete", product_listing.user_id)
  
  puts "  - Result: #{result}"
  
  if result[:success]
    puts "✅ Seller có thể hoàn thành đơn hàng!"
    
    # Kiểm tra MarketplaceHarvest đã được tạo
    puts "\n=== Checking MarketplaceHarvest creation ==="
    new_harvests = Models::Marketplace::MarketplaceHarvest.where(product_order_id: order.id)
    puts "  - New harvests for order #{order.id}: #{new_harvests.count}"
    
    if new_harvests.any?
      harvest = new_harvests.last
      puts "  - Harvest ID: #{harvest.id}"
      puts "  - Status: #{harvest.status}"
      puts "  - Quantity: #{harvest.actual_quantity}"
      puts "  - Notes: #{harvest.notes}"
    end
  else
    puts "❌ Seller không thể hoàn thành: #{result[:error]}"
  end
rescue => e
  puts "❌ Exception: #{e.message}"
  puts e.backtrace.first(5)
end

# Test với buyer
puts "\n=== Testing with Buyer (ID: #{order.buyer_id}) ==="
begin
  use_case = UseCases::Marketplace::ProductOrders::UpdateOrderStatus.new(
    Repositories::Marketplace::ProductOrderRepository.new,
    Repositories::Marketplace::ProductListingRepository.new
  )
  
  result = use_case.execute(order.id, "complete", order.buyer_id)
  
  puts "  - Result: #{result}"
  
  if result[:success]
    puts "✅ Buyer có thể hoàn thành đơn hàng!"
  else
    puts "❌ Buyer không thể hoàn thành: #{result[:error]}"
  end
rescue => e
  puts "❌ Exception: #{e.message}"
end

puts "\n=== Debug completed ===" 