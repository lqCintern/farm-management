namespace :labor do
  desc "Clean up invalid labor requests that violate current design"
  task cleanup_invalid_requests: :environment do
    puts "Starting cleanup of invalid labor requests..."
    
    # 1. Delete requests with completed/accepted status but no providing_household_id
    puts "\n1. Cleaning up requests with invalid status..."
    invalid_status_requests = Models::Labor::LaborRequest.where(
      status: ['completed', 'accepted'],
      providing_household_id: nil
    )
    
    puts "Found #{invalid_status_requests.count} requests with invalid status:"
    invalid_status_requests.each do |req|
      puts "  - ID #{req.id}: #{req.title} (status: #{req.status})"
    end
    
    if invalid_status_requests.count > 0
      invalid_status_requests.each do |req|
        begin
          req.destroy
          puts "  ✓ Deleted ID #{req.id}"
        rescue => e
          puts "  ✗ Failed to delete ID #{req.id}: #{e.message}"
        end
      end
    end
    
    # 2. Delete duplicate requests (keep the first one)
    puts "\n2. Cleaning up duplicate requests..."
    duplicates = Models::Labor::LaborRequest.group(:farm_activity_id, :requesting_household_id, :providing_household_id, :title, :description, :start_date, :end_date)
                                           .having('count(*) > 1')
                                           .pluck(:farm_activity_id, :requesting_household_id, :providing_household_id, :title, :description, :start_date, :end_date)
    
    puts "Found #{duplicates.count} groups of duplicate requests:"
    
    total_duplicates_deleted = 0
    duplicates.each do |group|
      farm_activity_id, requesting_household_id, providing_household_id, title, description, start_date, end_date = group
      
      duplicate_requests = Models::Labor::LaborRequest.where(
        farm_activity_id: farm_activity_id,
        requesting_household_id: requesting_household_id,
        providing_household_id: providing_household_id,
        title: title,
        description: description,
        start_date: start_date,
        end_date: end_date
      ).order(:created_at)
      
      # Keep the first one, delete the rest
      to_delete = duplicate_requests.offset(1)
      
      puts "  - Group: #{title} (farm_activity_id: #{farm_activity_id})"
      puts "    Keeping ID #{duplicate_requests.first.id}, deleting #{to_delete.count} duplicates: #{to_delete.pluck(:id).join(', ')}"
      
      to_delete.each do |req|
        begin
          req.destroy
          total_duplicates_deleted += 1
          puts "    ✓ Deleted ID #{req.id}"
        rescue => e
          puts "    ✗ Failed to delete ID #{req.id}: #{e.message}"
        end
      end
    end
    
    puts "Deleted #{total_duplicates_deleted} duplicate requests"
    
    # 3. Delete requests with empty or invalid titles
    puts "\n3. Cleaning up requests with invalid titles..."
    invalid_title_requests = Models::Labor::LaborRequest.where("title IS NULL OR title = '' OR title = 'Hoạt động '")
    
    puts "Found #{invalid_title_requests.count} requests with invalid titles:"
    invalid_title_requests.each do |req|
      puts "  - ID #{req.id}: '#{req.title}'"
    end
    
    invalid_title_requests.each do |req|
      begin
        req.destroy
        puts "  ✓ Deleted ID #{req.id}"
      rescue => e
        puts "  ✗ Failed to delete ID #{req.id}: #{e.message}"
      end
    end
    
    # 4. Delete orphaned requests (no farm_activity_id)
    puts "\n4. Cleaning up orphaned requests..."
    orphaned_requests = Models::Labor::LaborRequest.where(farm_activity_id: nil)
    
    puts "Found #{orphaned_requests.count} orphaned requests (no farm_activity_id):"
    orphaned_requests.each do |req|
      puts "  - ID #{req.id}: #{req.title}"
    end
    
    orphaned_requests.each do |req|
      begin
        req.destroy
        puts "  ✓ Deleted ID #{req.id}"
      rescue => e
        puts "  ✗ Failed to delete ID #{req.id}: #{e.message}"
      end
    end
    
    # Summary
    puts "\n=== CLEANUP SUMMARY ==="
    puts "Remaining requests: #{Models::Labor::LaborRequest.count}"
    puts "Cleanup completed!"
  end
end 