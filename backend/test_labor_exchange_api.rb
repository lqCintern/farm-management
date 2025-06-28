#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== TEST LABOR EXCHANGE API ==="

# Test exchange ID 6
exchange_id = 6
current_household_id = 3  # Hộ Gia Đình 2

puts "\n1. Kiểm tra exchange sau khi cleanup:"
exchange = Models::Labor::LaborExchange.find(exchange_id)
puts "Exchange ID: #{exchange.id}"
puts "Household A ID: #{exchange.household_a_id} (#{exchange.household_a&.name})"
puts "Household B ID: #{exchange.household_b_id} (#{exchange.household_b&.name})"
puts "Current household ID: #{current_household_id}"
puts "Balance: #{exchange.hours_balance}"

puts "\n2. Kiểm tra transactions sau khi cleanup:"
transactions = exchange.transactions.includes(labor_assignment: [:worker, :labor_request])
puts "Total transactions: #{transactions.count}"
transactions.each do |tx|
  puts "\nTransaction ID: #{tx.id}"
  puts "  Hours: #{tx.hours}"
  puts "  Description: #{tx.description}"
  puts "  Created at: #{tx.created_at}"
  
  if tx.labor_assignment
    assignment = tx.labor_assignment
    request = assignment.labor_request
    worker = assignment.worker
    
    puts "  Assignment ID: #{assignment.id}"
    puts "  Worker: #{worker&.user_name}"
    puts "  Work date: #{assignment.work_date}"
    puts "  Hours worked: #{assignment.hours_worked}"
    
    puts "  Request:"
    puts "    ID: #{request.id}"
    puts "    Title: #{request.title}"
    puts "    Requesting household: #{request.requesting_household&.name} (ID: #{request.requesting_household_id})"
    puts "    Providing household: #{request.providing_household&.name} (ID: #{request.providing_household_id})"
    
    # Xác định direction
    requesting_id = request.requesting_household_id
    providing_id = request.providing_household_id
    
    puts "  Direction analysis:"
    puts "    Exchange household_a_id: #{exchange.household_a_id}"
    puts "    Exchange household_b_id: #{exchange.household_b_id}"
    puts "    Requesting household_id: #{requesting_id}"
    puts "    Providing household_id: #{providing_id}"
    
    if requesting_id == exchange.household_a_id
      puts "    Exchange direction: a_requested (A yêu cầu từ B)"
    else
      puts "    Exchange direction: b_requested (B yêu cầu từ A)"
    end
    
    # Xác định vai trò của current household
    if requesting_id == current_household_id
      puts "    Current household role: REQUESTER (yêu cầu công)"
    elsif providing_id == current_household_id
      puts "    Current household role: PROVIDER (cung cấp công)"
    else
      puts "    Current household role: OTHER"
    end
  end
end

puts "\n3. Test repository mapping:"
repository = Repositories::Labor::LaborExchangeRepository.new
result = repository.get_transactions(exchange_id, { page: 1, per_page: 5 })

if result[:success]
  puts "Repository mapping successful"
  result[:transactions].each do |tx|
    puts "  Transaction ID: #{tx.id}"
    puts "    Hours: #{tx.hours}"
    puts "    Direction info: #{tx.direction_info.inspect}"
    puts "    Assignment details: #{tx.assignment_details.inspect}"
  end
else
  puts "Repository mapping failed: #{result[:errors]}"
end

puts "\n4. Test balance calculation:"
# Tính balance từ góc nhìn của current household
if current_household_id == exchange.household_a_id
  balance = -exchange.hours_balance
  direction = "a_requested"
elsif current_household_id == exchange.household_b_id
  balance = exchange.hours_balance
  direction = "b_requested"
else
  balance = 0
  direction = "unknown"
end

puts "Balance for household #{current_household_id}: #{balance}"
puts "Direction: #{direction}"

puts "\n=== TEST COMPLETED ===" 