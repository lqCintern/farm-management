#!/usr/bin/env ruby

# Test script để kiểm tra ảnh từ supply_listing
require_relative 'config/environment'

puts "=== Test SupplyListing Images ==="

# Tìm supply_listing có ảnh
supply_listing = Models::SupplyChain::SupplyListing.first
if supply_listing
  puts "SupplyListing ID: #{supply_listing.id}"
  puts "Name: #{supply_listing.name}"
  
  # Kiểm tra Active Storage
  puts "\n--- Active Storage ---"
  puts "main_image attached: #{supply_listing.main_image.attached?}"
  puts "main_image_url: #{supply_listing.main_image_url}"
  puts "additional_images attached: #{supply_listing.additional_images.attached?}"
  puts "additional_image_urls: #{supply_listing.additional_image_urls}"
  
  # Kiểm tra SupplyImage
  puts "\n--- SupplyImage ---"
  supply_images = supply_listing.supply_images.sorted
  puts "supply_images count: #{supply_images.count}"
  supply_images.each_with_index do |img, index|
    puts "  Image #{index + 1}: #{img.image_url}"
  end
  
  # Test farm_material với material_id
  farm_material = Models::Farming::FarmMaterial.find_by(material_id: supply_listing.id)
  if farm_material
    puts "\n--- FarmMaterial ---"
    puts "FarmMaterial ID: #{farm_material.id}"
    puts "Material ID: #{farm_material.material_id}"
    
    # Test repository mapping
    repository = Repositories::Farming::FarmMaterialRepository.new
    entity = repository.map_to_entity(farm_material)
    
    if entity.supply_listing
      puts "SupplyListing info:"
      puts "  main_image: #{entity.supply_listing[:main_image]}"
      puts "  images: #{entity.supply_listing[:images]}"
      puts "  brand: #{entity.supply_listing[:brand]}"
    else
      puts "No supply_listing info found"
    end
  else
    puts "\nNo farm_material found with material_id: #{supply_listing.id}"
  end
else
  puts "No supply_listing found"
end

puts "\n=== Test Complete ===" 