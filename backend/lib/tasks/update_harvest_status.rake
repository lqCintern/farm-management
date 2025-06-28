namespace :harvest do
  desc "Update harvest status for testing"
  task update_status: :environment do
    harvest_id = 6
    harvest = Models::Marketplace::MarketplaceHarvest.find(harvest_id)
    
    if harvest
      puts "Current harvest status: #{harvest.status}"
      harvest.update!(status: 2) # completed
      puts "Updated harvest status to: #{harvest.status}"
    else
      puts "Harvest not found"
    end
  end
end 