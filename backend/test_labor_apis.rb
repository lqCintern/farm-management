#!/usr/bin/env ruby

# Test script cho các API labor request
require_relative 'config/environment'

puts "=== Testing Labor Request APIs ==="

# Tạo test data
household1 = Labor::FarmHousehold.create!(
  name: "Hộ gia đình Test 1",
  address: "123 Test Street",
  owner_id: 1
)

household2 = Labor::FarmHousehold.create!(
  name: "Hộ gia đình Test 2", 
  address: "456 Test Street",
  owner_id: 2
)

puts "Created test households: #{household1.id}, #{household2.id}"

# Tạo labor requests
request1 = Labor::LaborRequest.create!(
  title: "Yêu cầu đổi công 1",
  description: "Cần giúp thu hoạch dứa",
  workers_needed: 3,
  request_type: "exchange",
  start_date: Date.today + 1,
  end_date: Date.today + 3,
  requesting_household_id: household1.id,
  status: "pending",
  is_public: true
)

request2 = Labor::LaborRequest.create!(
  title: "Yêu cầu đổi công 2", 
  description: "Cần giúp trồng dứa",
  workers_needed: 2,
  request_type: "exchange",
  start_date: Date.today + 2,
  end_date: Date.today + 4,
  requesting_household_id: household1.id,
  providing_household_id: household2.id,
  status: "accepted"
)

request3 = Labor::LaborRequest.create!(
  title: "Yêu cầu đổi công 3",
  description: "Cần giúp bón phân",
  workers_needed: 1,
  request_type: "paid",
  rate: 200000,
  start_date: Date.today + 5,
  end_date: Date.today + 7,
  requesting_household_id: household2.id,
  status: "pending",
  is_public: true
)

puts "Created test requests: #{request1.id}, #{request2.id}, #{request3.id}"

# Test 1: Lấy yêu cầu của household1 (tôi tạo)
puts "\n=== Test 1: Lấy yêu cầu của tôi ==="
filters = { requesting_household_id: household1.id }
requests = Services::CleanArch.labor_list_requests.execute(household1.id, filters)
puts "Requests created by household1: #{requests.length}"
requests.each do |req|
  puts "- #{req.title} (Status: #{req.status})"
end

# Test 2: Lấy yêu cầu household1 tham gia (tôi được yêu cầu)
puts "\n=== Test 2: Lấy yêu cầu tôi tham gia ==="
filters = { providing_household_id: household2.id }
requests = Services::CleanArch.labor_list_requests.execute(household2.id, filters)
puts "Requests participated by household2: #{requests.length}"
requests.each do |req|
  puts "- #{req.title} (Status: #{req.status})"
end

# Test 3: Lấy yêu cầu công khai
puts "\n=== Test 3: Lấy yêu cầu công khai ==="
filters = { exclude_household_id: household1.id }
public_requests = Services::CleanArch.labor_list_public_requests.execute(filters)
puts "Public requests: #{public_requests.length}"
public_requests.each do |req|
  puts "- #{req.title} (From: #{req.requesting_household_name})"
end

# Test 4: Lọc theo status
puts "\n=== Test 4: Lọc theo status ==="
filters = { status: "pending" }
pending_requests = Services::CleanArch.labor_list_requests.execute(household1.id, filters)
puts "Pending requests: #{pending_requests.length}"
pending_requests.each do |req|
  puts "- #{req.title}"
end

# Test 5: Lấy yêu cầu theo farm activity
puts "\n=== Test 5: Lấy yêu cầu theo farm activity ==="
# Tạo farm activity
farm_activity = FarmActivity.create!(
  title: "Thu hoạch dứa",
  description: "Thu hoạch dứa vườn 1",
  activity_type: "harvest",
  start_date: Date.today + 1,
  end_date: Date.today + 3,
  field_id: 1,
  status: "pending"
)

# Cập nhật request1 để liên kết với farm activity
request1.update!(farm_activity_id: farm_activity.id)

activity_requests = Services::CleanArch.labor_list_requests_by_activity.execute(
  household1.id, 
  farm_activity.id
)
puts "Requests for farm activity: #{activity_requests.length}"
activity_requests.each do |req|
  puts "- #{req.title}"
end

# Test 6: Gợi ý người lao động
puts "\n=== Test 6: Gợi ý người lao động ==="
result = Services::CleanArch.labor_suggest_workers.execute(request1.id, 3)
if result[:success]
  puts "Suggested workers: #{result[:workers].length}"
  result[:workers].each do |worker|
    puts "- #{worker.name}"
  end
else
  puts "Error: #{result[:errors]}"
end

# Test 7: Group status
puts "\n=== Test 7: Group status ==="
# Tạo group requests
parent_request = Labor::LaborRequest.create!(
  title: "Yêu cầu nhóm",
  description: "Yêu cầu nhóm test",
  workers_needed: 5,
  request_type: "mixed",
  start_date: Date.today + 10,
  end_date: Date.today + 12,
  requesting_household_id: household1.id,
  status: "pending",
  request_group_id: SecureRandom.uuid
)

child1 = Labor::LaborRequest.create!(
  title: "Yêu cầu con 1",
  description: "Yêu cầu con 1",
  workers_needed: 2,
  request_type: "exchange",
  start_date: Date.today + 10,
  end_date: Date.today + 12,
  requesting_household_id: household1.id,
  providing_household_id: household2.id,
  status: "accepted",
  parent_request_id: parent_request.id,
  request_group_id: parent_request.request_group_id
)

child2 = Labor::LaborRequest.create!(
  title: "Yêu cầu con 2",
  description: "Yêu cầu con 2", 
  workers_needed: 3,
  request_type: "exchange",
  start_date: Date.today + 10,
  end_date: Date.today + 12,
  requesting_household_id: household1.id,
  status: "pending",
  parent_request_id: parent_request.id,
  request_group_id: parent_request.request_group_id
)

group_status = Services::CleanArch.labor_get_group_status.execute(parent_request.id)
if group_status[:success]
  status = group_status[:status]
  puts "Group status:"
  puts "- Total: #{status[:total]}"
  puts "- Accepted: #{status[:accepted]}"
  puts "- Pending: #{status[:pending]}"
  puts "- Declined: #{status[:declined]}"
else
  puts "Error: #{group_status[:errors]}"
end

puts "\n=== Test completed ==="

# Cleanup
puts "\nCleaning up test data..."
Labor::LaborRequest.where(id: [request1.id, request2.id, request3.id, parent_request.id, child1.id, child2.id]).destroy_all
Labor::FarmHousehold.where(id: [household1.id, household2.id]).destroy_all
FarmActivity.where(id: farm_activity.id).destroy_all

puts "Cleanup completed!" 