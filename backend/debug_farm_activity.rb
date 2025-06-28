#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "=== Debug Farm Activity 221 ==="

# Tìm farm activity
activity = Models::Farming::FarmActivity.find(221)

puts "Farm Activity Details:"
puts "  ID: #{activity.id}"
puts "  Activity Type: #{activity.activity_type}"
puts "  Description: '#{activity.description}'"
puts "  Status: #{activity.status}"
puts "  Start Date: #{activity.start_date}"
puts "  End Date: #{activity.end_date}"

# Kiểm tra điều kiện bỏ qua validation
puts "\nValidation Skip Conditions:"
puts "  Parent Activity: #{activity.parent_activity.present?}"
puts "  Pineapple Crop: #{activity.pineapple_crop.present?}"
puts "  Skip Process Validation: #{activity.skip_process_validation}"
puts "  Description includes 'Thu hoạch marketplace': #{activity.description&.include?('Thu hoạch marketplace')}"

# Test validation trực tiếp
puts "\nTesting Validation:"
activity.valid?
puts "  Errors: #{activity.errors.full_messages}"

# Kiểm tra các hoạt động trước đó
puts "\nPrevious Activities:"
previous_activities = Models::Farming::FarmActivity.where(
  crop_animal_id: activity.crop_animal_id,
  field_id: activity.field_id
).where("start_date < ?", activity.start_date).order(start_date: :asc)

puts "  Total previous activities: #{previous_activities.count}"
previous_activities.each do |prev|
  puts "    - #{prev.activity_type} (#{prev.start_date})"
end

puts "\n=== Debug completed ===" 