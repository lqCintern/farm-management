#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "=== Cleanup Marketplace Harvests ==="

# Đếm số lượng harvests hiện tại
total_harvests = Models::Marketplace::MarketplaceHarvest.count
puts "Tổng số harvests hiện tại: #{total_harvests}"

# Xóa tất cả marketplace harvests
deleted_count = Models::Marketplace::MarketplaceHarvest.destroy_all.count
puts "Đã xóa #{deleted_count} harvests"

# Xóa các farm activities liên quan (nếu có)
farm_activities = Models::Farming::FarmActivity.where(activity_type: "harvesting")
  .where("description LIKE ?", "%Thu hoạch marketplace%")
deleted_activities = farm_activities.destroy_all.count
puts "Đã xóa #{deleted_activities} farm activities liên quan"

puts "=== Cleanup completed ==="
puts "Bây giờ bạn có thể test lại việc tạo harvest mới!" 