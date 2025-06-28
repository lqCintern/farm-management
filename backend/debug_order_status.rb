#!/usr/bin/env ruby

# Debug script để kiểm tra trạng thái đơn hàng
require_relative 'config/environment'

puts "=== Debug Order Status ==="

# Kiểm tra tất cả đơn hàng của product_listing_id = 15 và buyer_id = 150
orders = Models::Marketplace::ProductOrder.where(
  product_listing_id: 15,
  buyer_id: 150
)

puts "Tổng số đơn hàng: #{orders.count}"

orders.each do |order|
  puts "Order ID: #{order.id}"
  puts "  Status: #{order.status} (#{order.status_before_type_cast})"
  puts "  Quantity: #{order.quantity}"
  puts "  Created: #{order.created_at}"
  puts "  Updated: #{order.updated_at}"
  puts "---"
end

# Kiểm tra đơn hàng active (pending, accepted)
active_orders = Models::Marketplace::ProductOrder.where(
  product_listing_id: 15,
  buyer_id: 150,
  status: [:pending, :accepted]
)

puts "Đơn hàng active (pending/accepted): #{active_orders.count}"

active_orders.each do |order|
  puts "Active Order ID: #{order.id}, Status: #{order.status}"
end

# Test query giống như trong repository
puts "\n=== Testing Repository Query ==="
result = Models::Marketplace::ProductOrder.exists?(
  product_listing_id: 15,
  buyer_id: 150,
  status: [:pending, :accepted]
)
puts "Repository query result: #{result}"

# Test với raw SQL
puts "\n=== Testing Raw SQL ==="
sql_result = Models::Marketplace::ProductOrder.connection.execute(
  "SELECT COUNT(*) as count FROM product_orders WHERE product_listing_id = 15 AND buyer_id = 150 AND status IN (0, 1)"
)
puts "Raw SQL result: #{sql_result.first['count']}"

# Kiểm tra product listing
product = Models::Marketplace::ProductListing.find(15)
puts "\nProduct Listing:"
puts "  ID: #{product.id}"
puts "  Title: #{product.title}"
puts "  Quantity: #{product.quantity}"
puts "  Status: #{product.status}"
puts "---"

puts "Debug completed!" 