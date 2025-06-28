#!/usr/bin/env ruby

# Test script để kiểm tra việc cho phép thương lái tạo nhiều đơn hàng trên 1 sản phẩm
require_relative 'config/environment'

puts "=== Test Multiple Orders for Same Product ==="

# Tìm một thương lái
trader = Models::User.where(user_type: 'trader').first
unless trader
  puts "❌ Không tìm thấy thương lái nào"
  exit 1
end

puts "👤 Thương lái: #{trader.fullname} (#{trader.user_id})"

# Tìm một sản phẩm active
product = Models::Marketplace::ProductListing.where(status: 'active').first
unless product
  puts "❌ Không tìm thấy sản phẩm active nào"
  exit 1
end

puts "📦 Sản phẩm: #{product.title} (ID: #{product.id})"

# Kiểm tra đơn hàng hiện tại
existing_orders = Models::Marketplace::ProductOrder.where(
  product_listing_id: product.id,
  buyer_id: trader.user_id
)
puts "📋 Đơn hàng hiện tại: #{existing_orders.count}"

existing_orders.each do |order|
  puts "  - Order #{order.id}: #{order.status} (#{order.quantity} x #{order.price})"
end

# Tạo đơn hàng đầu tiên
puts "\n🔄 Tạo đơn hàng đầu tiên..."
order_repository = Services::CleanArch.marketplace_product_order_repository
product_repository = Services::CleanArch.marketplace_product_listing_repository

order1_entity = Entities::Marketplace::ProductOrder.new(
  buyer_id: trader.user_id,
  product_listing_id: product.id,
  quantity: 10,
  price: product.price_expectation,
  note: "Đơn hàng test 1",
  status: :pending
)

order1 = order_repository.create(order1_entity)
if order1
  puts "✅ Tạo đơn hàng 1 thành công: ID #{order1.id}"
else
  puts "❌ Không thể tạo đơn hàng 1"
  exit 1
end

# Kiểm tra order_exists? method
puts "\n🔍 Kiểm tra order_exists? method..."
exists = order_repository.order_exists?(product.id, trader.user_id)
puts "order_exists? result: #{exists}"

# Tạo đơn hàng thứ hai
puts "\n🔄 Tạo đơn hàng thứ hai..."
order2_entity = Entities::Marketplace::ProductOrder.new(
  buyer_id: trader.user_id,
  product_listing_id: product.id,
  quantity: 5,
  price: product.price_expectation * 1.1,
  note: "Đơn hàng test 2",
  status: :pending
)

order2 = order_repository.create(order2_entity)
if order2
  puts "✅ Tạo đơn hàng 2 thành công: ID #{order2.id}"
else
  puts "❌ Không thể tạo đơn hàng 2"
  exit 1
end

# Tạo đơn hàng thứ ba
puts "\n🔄 Tạo đơn hàng thứ ba..."
order3_entity = Entities::Marketplace::ProductOrder.new(
  buyer_id: trader.user_id,
  product_listing_id: product.id,
  quantity: 15,
  price: product.price_expectation * 0.9,
  note: "Đơn hàng test 3",
  status: :pending
)

order3 = order_repository.create(order3_entity)
if order3
  puts "✅ Tạo đơn hàng 3 thành công: ID #{order3.id}"
else
  puts "❌ Không thể tạo đơn hàng 3"
  exit 1
end

# Kiểm tra tất cả đơn hàng
puts "\n📋 Tất cả đơn hàng sau khi tạo:"
all_orders = Models::Marketplace::ProductOrder.where(
  product_listing_id: product.id,
  buyer_id: trader.user_id
).order(:created_at)

all_orders.each do |order|
  puts "  - Order #{order.id}: #{order.status} (#{order.quantity} x #{order.price}) - #{order.note}"
end

# Test accept một đơn hàng
puts "\n🔄 Test accept đơn hàng 1..."
update_service = Services::CleanArch.marketplace_update_order_status
result = update_service.execute(order1.id, "accept", product.user_id)

if result[:success]
  puts "✅ Accept đơn hàng 1 thành công"
else
  puts "❌ Không thể accept đơn hàng 1: #{result[:error]}"
end

# Kiểm tra trạng thái sau khi accept
puts "\n📋 Trạng thái đơn hàng sau khi accept:"
all_orders.reload.each do |order|
  puts "  - Order #{order.id}: #{order.status} (#{order.quantity} x #{order.price}) - #{order.note}"
end

# Kiểm tra trạng thái sản phẩm
product.reload
puts "\n📦 Trạng thái sản phẩm: #{product.status}"

puts "\n✅ Test hoàn thành! Thương lái có thể tạo nhiều đơn hàng trên 1 sản phẩm." 