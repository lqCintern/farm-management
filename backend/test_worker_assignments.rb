#!/usr/bin/env ruby

# Test script để kiểm tra worker assignments
require_relative 'config/environment'

puts "=== Test Worker Assignments ==="

# Tìm user đầu tiên để test
user = Models::User.first
if user
  puts "Testing with user ID: #{user.id}"
  puts "User name: #{user.user_name}"
  
  # Kiểm tra xem user có phải là worker không
  worker_profile = Models::Labor::WorkerProfile.find_by(user_id: user.id)
  if worker_profile
    puts "User is a worker"
  else
    puts "User is not a worker, creating worker profile..."
    worker_profile = Models::Labor::WorkerProfile.create!(user_id: user.id)
  end
  
  # Kiểm tra assignments
  assignments = Models::Labor::LaborAssignment.where(worker_id: user.id)
  puts "Total assignments for this worker: #{assignments.count}"
  
  if assignments.any?
    puts "\nAssignments found:"
    assignments.each do |assignment|
      puts "  - ID: #{assignment.id}, Status: #{assignment.status}, Date: #{assignment.work_date}"
      puts "    Request: #{assignment.labor_request&.title || 'N/A'}"
    end
  else
    puts "\nNo assignments found for this worker"
    
    # Tạo một assignment test
    puts "\nCreating test assignment..."
    
    # Tìm labor request đầu tiên
    labor_request = Models::Labor::LaborRequest.first
    if labor_request
      test_assignment = Models::Labor::LaborAssignment.create!(
        labor_request_id: labor_request.id,
        worker_id: user.id,
        home_household_id: labor_request.providing_household_id,
        work_date: Date.today + 1.day,
        start_time: Time.parse('08:00'),
        end_time: Time.parse('17:00'),
        status: 'assigned'
      )
      puts "Created test assignment ID: #{test_assignment.id}"
    else
      puts "No labor requests found to create test assignment"
    end
  end
  
  # Test API call
  puts "\n=== Testing API Call ==="
  begin
    # Simulate API call
    filters = {}
    assignments = Services::CleanArch.labor_list_worker_assignments.execute(user.id, filters)
    puts "API returned #{assignments.length} assignments"
    
    if assignments.any?
      assignments.each do |assignment|
        puts "  - Assignment ID: #{assignment.id}"
        puts "    Status: #{assignment.status}"
        puts "    Work Date: #{assignment.work_date}"
        puts "    Request Title: #{assignment.labor_request&.title || 'N/A'}"
      end
    end
  rescue => e
    puts "Error calling API: #{e.message}"
    puts e.backtrace.first(5)
  end
  
else
  puts "No users found in database"
end

puts "\n=== Test Complete ===" 