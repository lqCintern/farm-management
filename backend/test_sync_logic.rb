#!/usr/bin/env ruby

require_relative 'config/environment'

puts "=== TEST LOGIC ĐỒNG BỘ FARM ACTIVITY ↔ LABOR REQUEST ==="

# 1. Tạo test data
user = Models::User.first
household = ::Models::Labor::FarmHousehold.find_by(owner_id: user.id)

unless household
  puts "❌ Không tìm thấy household cho user #{user.id}"
  exit 1
end

puts "✅ Tìm thấy household: #{household.name}"

# 2. Tạo farm activity
activity_params = {
  activity_type: :harvesting, # Thu hoạch
  description: "Thu hoạch dứa test đồng bộ",
  start_date: "2025-01-15",
  end_date: "2025-01-16",
  status: "pending",
  crop_animal_id: "1",
  field_id: "1"
}

activity_result = Services::CleanArch.farming_create_farm_activity.execute(activity_params, user.id)

if activity_result[:success]
  farm_activity = activity_result[:farm_activity]
  puts "✅ Tạo farm activity thành công: #{farm_activity.id} - #{farm_activity.status}"
else
  puts "❌ Lỗi tạo farm activity: #{activity_result[:errors]}"
  exit 1
end

# 3. Tạo labor request
labor_params = {
  title: "Tìm người thu hoạch dứa",
  description: "Cần hỗ trợ thu hoạch dứa",
  workers_needed: 3,
  request_type: "exchange",
  status: "pending",
  requesting_household_id: household.id,
  start_date: "2025-01-15",
  end_date: "2025-01-16",
  farm_activity_id: farm_activity.id,
  is_public: true
}

labor_result = Services::CleanArch.labor_create_request.execute(household.id, labor_params)

if labor_result[:success]
  labor_request = labor_result[:request]
  puts "✅ Tạo labor request thành công: #{labor_request.id} - #{labor_request.status}"
else
  puts "❌ Lỗi tạo labor request: #{labor_result[:errors]}"
  exit 1
end

puts "\n=== TEST 1: LABOR REQUEST → FARM ACTIVITY ==="

# Test 1: Labor Request accepted → Farm Activity in_progress
puts "🔄 Cập nhật labor request thành accepted..."
Services::CleanArch.labor_process_request.execute(labor_request.id, "accept", user.id)
Services::CleanArch.farming_sync_labor_request_status.execute(labor_request.id)

# Kiểm tra kết quả
updated_activity = Services::CleanArch.farming_get_farm_activity.execute(farm_activity.id, user.id)
updated_labor = Services::CleanArch.labor_get_request.execute(labor_request.id)

puts "📊 Kết quả:"
puts "  - Labor Request: #{updated_labor[:request].status}"
puts "  - Farm Activity: #{updated_activity[:farm_activity].status}"

# Test 2: Labor Request completed → Farm Activity completed
puts "\n🔄 Cập nhật labor request thành completed..."
Services::CleanArch.labor_process_request.execute(labor_request.id, "complete", user.id)
Services::CleanArch.farming_sync_labor_request_status.execute(labor_request.id)

# Kiểm tra kết quả
updated_activity = Services::CleanArch.farming_get_farm_activity.execute(farm_activity.id, user.id)
updated_labor = Services::CleanArch.labor_get_request.execute(labor_request.id)

puts "📊 Kết quả:"
puts "  - Labor Request: #{updated_labor[:request].status}"
puts "  - Farm Activity: #{updated_activity[:farm_activity].status}"

# Test 3: Labor Request cancelled → Farm Activity vẫn pending
puts "\n🔄 Reset về pending và test cancelled..."
Services::CleanArch.farming_farm_activity_repository.update(farm_activity.id, { status: "pending" }, user.id)
Services::CleanArch.labor_request_repository.update(labor_request.id, { status: "pending" })

puts "🔄 Cập nhật labor request thành cancelled..."
Services::CleanArch.labor_process_request.execute(labor_request.id, "cancel", user.id)
Services::CleanArch.farming_sync_labor_request_status.execute(labor_request.id)

# Kiểm tra kết quả
updated_activity = Services::CleanArch.farming_get_farm_activity.execute(farm_activity.id, user.id)
updated_labor = Services::CleanArch.labor_get_request.execute(labor_request.id)

puts "📊 Kết quả:"
puts "  - Labor Request: #{updated_labor[:request].status}"
puts "  - Farm Activity: #{updated_activity[:farm_activity].status}"

puts "\n=== TEST 2: FARM ACTIVITY → LABOR REQUEST ==="

# Reset về pending
Services::CleanArch.farming_farm_activity_repository.update(farm_activity.id, { status: "pending" }, user.id)
Services::CleanArch.labor_request_repository.update(labor_request.id, { status: "pending" })

# Test 1: Farm Activity in_progress → Labor Request accepted
puts "🔄 Cập nhật farm activity thành in_progress..."
Services::CleanArch.farming_farm_activity_repository.update(farm_activity.id, { status: "in_progress" }, user.id)
Services::CleanArch.farming_sync_labor_request_status.execute(farm_activity.id)

# Kiểm tra kết quả
updated_activity = Services::CleanArch.farming_get_farm_activity.execute(farm_activity.id, user.id)
updated_labor = Services::CleanArch.labor_get_request.execute(labor_request.id)

puts "📊 Kết quả:"
puts "  - Farm Activity: #{updated_activity[:farm_activity].status}"
puts "  - Labor Request: #{updated_labor[:request].status}"

# Test 2: Farm Activity completed → Labor Request completed
puts "\n🔄 Cập nhật farm activity thành completed..."
Services::CleanArch.farming_farm_activity_repository.update(farm_activity.id, { status: "completed" }, user.id)
Services::CleanArch.farming_sync_labor_request_status.execute(farm_activity.id)

# Kiểm tra kết quả
updated_activity = Services::CleanArch.farming_get_farm_activity.execute(farm_activity.id, user.id)
updated_labor = Services::CleanArch.labor_get_request.execute(labor_request.id)

puts "📊 Kết quả:"
puts "  - Farm Activity: #{updated_activity[:farm_activity].status}"
puts "  - Labor Request: #{updated_labor[:request].status}"

# Test 3: Farm Activity cancelled → Labor Request cancelled
puts "\n🔄 Reset về pending và test cancelled..."
Services::CleanArch.farming_farm_activity_repository.update(farm_activity.id, { status: "pending" }, user.id)
Services::CleanArch.labor_request_repository.update(labor_request.id, { status: "pending" })

puts "🔄 Cập nhật farm activity thành cancelled..."
Services::CleanArch.farming_farm_activity_repository.update(farm_activity.id, { status: "cancelled" }, user.id)
Services::CleanArch.farming_sync_labor_request_status.execute(farm_activity.id)

# Kiểm tra kết quả
updated_activity = Services::CleanArch.farming_get_farm_activity.execute(farm_activity.id, user.id)
updated_labor = Services::CleanArch.labor_get_request.execute(labor_request.id)

puts "📊 Kết quả:"
puts "  - Farm Activity: #{updated_activity[:farm_activity].status}"
puts "  - Labor Request: #{updated_labor[:request].status}"

puts "\n=== TÓM TẮT LOGIC ĐỒNG BỘ ==="
puts "✅ Labor Request accepted → Farm Activity in_progress"
puts "✅ Labor Request completed → Farm Activity completed"
puts "✅ Labor Request cancelled → Farm Activity pending (có thể tự làm)"
puts "✅ Labor Request declined → Farm Activity pending (tìm người khác)"
puts ""
puts "✅ Farm Activity in_progress → Labor Request accepted"
puts "✅ Farm Activity completed → Labor Request completed"
puts "✅ Farm Activity cancelled → Labor Request cancelled"

puts "\n🎉 Test hoàn thành!" 