#!/usr/bin/env ruby

# Test script để kiểm tra logic tính total_amount
require_relative 'config/environment'

puts "=== Test Total Amount Calculation ==="

# Tạo test data
test_order = {
  price: 12000.0,
  quantity: 1001.0,
  total_weight: 500.5
}

puts "Test data:"
puts "  Price: #{test_order[:price]} VND/kg"
puts "  Quantity: #{test_order[:quantity]} kg"
puts "  Total Weight: #{test_order[:total_weight]} kg"

# Test logic cũ (price * quantity)
old_total = test_order[:price] * test_order[:quantity]
puts "\nOld logic (price * quantity):"
puts "  #{test_order[:price]} * #{test_order[:quantity]} = #{old_total} VND"

# Test logic mới (price * total_weight)
new_total = test_order[:price] * test_order[:total_weight]
puts "\nNew logic (price * total_weight):"
puts "  #{test_order[:price]} * #{test_order[:total_weight]} = #{new_total} VND"

# So sánh
difference = new_total - old_total
puts "\nDifference:"
puts "  New - Old = #{difference} VND"
puts "  Percentage change: #{(difference / old_total * 100).round(2)}%"

puts "\n=== Test with actual order from database ==="

# Tìm order thực tế trong database
if defined?(Models::Marketplace::ProductOrder)
  order = Models::Marketplace::ProductOrder.where.not(total_weight: nil).first
  
  if order
    puts "Found order ID: #{order.id}"
    puts "  Price: #{order.price} VND/kg"
    puts "  Quantity: #{order.quantity} kg"
    puts "  Total Weight: #{order.total_weight} kg"
    
    old_calc = order.price * order.quantity
    new_calc = order.price * order.total_weight
    
    puts "  Old calculation: #{old_calc} VND"
    puts "  New calculation: #{new_calc} VND"
    puts "  Actual total_amount: #{order.total_amount} VND"
    
    if order.total_amount == new_calc
      puts "  ✅ Total amount calculation is correct!"
    else
      puts "  ❌ Total amount calculation needs update!"
    end
  else
    puts "No orders with total_weight found in database"
  end
else
  puts "Models::Marketplace::ProductOrder not available"
end

puts "\n=== Test completed ===" 