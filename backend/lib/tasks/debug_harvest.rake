namespace :debug do
  desc "Debug harvest records for product listing"
  task harvest: :environment do
    product_listing_id = 13
    
    puts "=== Harvest records for product listing #{product_listing_id} ==="
    
    harvests = Models::Marketplace::MarketplaceHarvest.where(product_listing_id: product_listing_id)
    
    if harvests.empty?
      puts "No harvest records found"
    else
      harvests.each do |harvest|
        puts "ID: #{harvest.id}"
        puts "Status: #{harvest.status} (#{harvest.status_before_type_cast})"
        puts "Trader ID: #{harvest.trader_id}"
        puts "Scheduled Date: #{harvest.scheduled_date}"
        puts "Location: #{harvest.location}"
        puts "Created: #{harvest.created_at}"
        puts "---"
      end
    end
    
    puts "\n=== Active harvests (not completed/cancelled) ==="
    active_harvests = Models::Marketplace::MarketplaceHarvest
      .where(product_listing_id: product_listing_id)
      .where.not(status: [2, 3])
    
    if active_harvests.empty?
      puts "No active harvests found"
    else
      active_harvests.each do |harvest|
        puts "ID: #{harvest.id}, Status: #{harvest.status}"
      end
    end
  end
end 