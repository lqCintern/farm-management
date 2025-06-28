#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== CLEANUP DUPLICATE TRANSACTIONS ==="

# Kiểm tra và xóa duplicate transactions
exchange_id = 6

puts "\n1. Kiểm tra transactions trước khi cleanup:"
exchange = Models::Labor::LaborExchange.find(exchange_id)
transactions = exchange.transactions.order(:created_at)

puts "Total transactions: #{transactions.count}"
transactions.each do |tx|
  puts "  ID: #{tx.id}, Assignment ID: #{tx.labor_assignment_id}, Hours: #{tx.hours}, Created: #{tx.created_at}"
end

# Tìm duplicate transactions
duplicates = transactions.group_by(&:labor_assignment_id).select { |assignment_id, group| group.size > 1 }

if duplicates.any?
  puts "\n2. Tìm thấy duplicate transactions:"
  duplicates.each do |assignment_id, group|
    puts "  Assignment ID #{assignment_id}: #{group.size} transactions"
    group.each do |tx|
      puts "    Transaction ID: #{tx.id}, Hours: #{tx.hours}, Created: #{tx.created_at}"
    end
  end
  
  puts "\n3. Xóa duplicate transactions (giữ lại transaction đầu tiên):"
  duplicates.each do |assignment_id, group|
    # Giữ lại transaction đầu tiên, xóa các transaction còn lại
    transactions_to_delete = group[1..-1]
    transactions_to_delete.each do |tx|
      puts "  Xóa transaction ID: #{tx.id}"
      tx.destroy
    end
  end
  
  puts "\n4. Kiểm tra transactions sau khi cleanup:"
  exchange.reload
  transactions_after = exchange.transactions.order(:created_at)
  puts "Total transactions sau cleanup: #{transactions_after.count}"
  transactions_after.each do |tx|
    puts "  ID: #{tx.id}, Assignment ID: #{tx.labor_assignment_id}, Hours: #{tx.hours}, Created: #{tx.created_at}"
  end
  
  # Tính lại balance
  puts "\n5. Tính lại balance:"
  old_balance = exchange.hours_balance
  puts "Balance cũ: #{old_balance}"
  
  # Tính lại balance từ transactions
  new_balance = exchange.transactions.sum(:hours)
  exchange.update!(hours_balance: new_balance)
  puts "Balance mới: #{new_balance}"
  
else
  puts "\n2. Không tìm thấy duplicate transactions"
end

puts "\n=== CLEANUP COMPLETED ===" 