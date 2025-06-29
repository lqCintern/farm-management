#!/usr/bin/env ruby

# Script test tích hợp giữa farm activity và labor request
require_relative 'config/environment'

puts "=== Test Tích hợp Farm Activity và Labor Request ==="

# Tìm user và household
user = Models::User.first
if user.nil?
  puts "❌ Không tìm thấy user nào"
  exit 1
end

puts "👤 User: #{user.email}"

# Tìm household của user
household = Models::Labor::FarmHousehold.find_by(owner_id: user.user_id)
if household.nil?
  puts "❌ Không tìm thấy household cho user"
  exit 1
end

puts "🏠 Household: #{household.name}"

# Test 1: Tạo farm activity với auto labor
puts "\n1. Test tạo farm activity với auto labor..."

activity_params = {
  activity_type: "harvesting", # Thu hoạch - cần 3 người
  description: "Thu hoạch dứa vụ 1",
  start_date: Date.today + 7.days,
  end_date: Date.today + 7.days,
  frequency: "once",
  field_id: Models::Farming::Field.where(user_id: user.user_id).first&.id,
  auto_create_labor: true
}

puts "📋 Activity params: #{activity_params}"

# Test use case mới
result = Services::CleanArch.farming_create_activity_with_labor.execute(activity_params, user.user_id)

if result[:success]
  activity = result[:activity]
  puts "✅ Tạo farm activity thành công: ID #{activity.id}"
  
  # Kiểm tra xem có labor request được tạo không
  labor_requests = Models::Labor::LaborRequest.where(farm_activity_id: activity.id)
  puts "🔍 Tìm thấy #{labor_requests.count} labor requests"
  
  labor_requests.each do |req|
    puts "  - Labor Request ID: #{req.id}"
    puts "    Title: #{req.title}"
    puts "    Workers needed: #{req.workers_needed}"
    puts "    Status: #{req.status}"
    puts "    Requesting household: #{req.requesting_household.name}"
  end
else
  puts "❌ Lỗi tạo farm activity: #{result[:errors]}"
end

# Test 2: Đồng bộ status
puts "\n2. Test đồng bộ status..."

if labor_requests.any?
  labor_request = labor_requests.first
  
  puts "🔄 Test đồng bộ status cho labor request #{labor_request.id}"
  puts "  Trước: Labor status = #{labor_request.status}, Activity status = #{activity.status}"
  
  # Thay đổi status labor request
  labor_request.update(status: "completed")
  
  # Đồng bộ status
  sync_result = Services::CleanArch.labor_sync_activity_status.execute(labor_request.id)
  
  if sync_result[:success]
    activity.reload
    puts "✅ Đồng bộ thành công"
    puts "  Sau: Labor status = #{labor_request.status}, Activity status = #{activity.status}"
  else
    puts "❌ Lỗi đồng bộ: #{sync_result[:errors]}"
  end
end

# Test 3: Logic thông minh
puts "\n3. Test logic thông minh..."

activity_types = [
  { type: "watering", expected_workers: 1, name: "Tưới nước" },
  { type: "fertilizing", expected_workers: 2, name: "Bón phân" },
  { type: "harvesting", expected_workers: 3, name: "Thu hoạch" },
  { type: "pesticide", expected_workers: 2, name: "Phun thuốc" }
]

activity_types.each do |test_case|
  puts "\n🧪 Test #{test_case[:name]}..."
  
  test_params = {
    activity_type: test_case[:type],
    description: "Test #{test_case[:name]}",
    start_date: Date.today + 10.days,
    end_date: Date.today + 10.days,
    frequency: "once",
    field_id: Models::Farming::Field.where(user_id: user.user_id).first&.id
  }
  
  # Test logic should_create_labor_request
  use_case = Services::CleanArch.farming_create_activity_with_labor
  activity_entity = Entities::Farming::FarmActivity.new(test_params)
  
  # Sử dụng reflection để test private method
  should_create = use_case.send(:should_create_labor_request?, activity_entity)
  workers_needed = use_case.send(:estimate_workers_needed, activity_entity)
  
  puts "  Should create labor request: #{should_create}"
  puts "  Expected workers: #{test_case[:expected_workers]}, Actual: #{workers_needed}"
  puts "  ✅ Pass" if workers_needed == test_case[:expected_workers]
end

puts "\n=== Test hoàn thành ===" 