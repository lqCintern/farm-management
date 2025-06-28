# Seed product_listing, trader, và harvest marketplace
farmer = Models::User.find_or_create_by!(user_id: 28) do |u|
  u.user_type = 'farmer'
  u.user_name = 'farmer_seed_1'
  u.email = 'farmer1@example.com'
  u.password = 'password'
  u.fullname = 'Nông dân 1'
  u.address = 'Địa chỉ 1'
  u.phone = '0123456789'
end

trader = Models::User.find_or_create_by!(user_id: 150) do |u|
  u.user_type = 'trader'
  u.user_name = 'trader_seed_1'
  u.email = 'trader1@example.com'
  u.password = 'password'
  u.fullname = 'Thương lái 1'
  u.address = 'Địa chỉ 2'
  u.phone = '0987654321'
end

field = Models::Farming::Field.first || Models::Farming::Field.create!(name: 'Field 1', user_id: farmer.user_id, coordinates: [{"lat"=>10.1, "lng"=>106.1}, {"lat"=>10.2, "lng"=>106.2}, {"lat"=>10.1, "lng"=>106.2}])
crop = Models::Farming::PineappleCrop.first || Models::Farming::PineappleCrop.create!(name: 'Pineapple', user_id: farmer.user_id, field_id: field.id, status: 1)

product_listing = Models::Marketplace::ProductListing.create!(
  title: 'Dứa Queen',
  description: 'Dứa Queen ngon ngọt',
  product_type: 'pineapple',
  quantity: 1000,
  price_expectation: 15000,
  status: 1,
  user_id: farmer.user_id,
  crop_animal_id: crop.id,
  province: 'Bến Tre',
  district: 'Mỏ Cày',
  ward: 'An Thạnh',
  address: 'Ấp 1',
  latitude: 10.1,
  longitude: 106.1
)

Models::Marketplace::MarketplaceHarvest.create!(
  scheduled_date: Time.now + 2.days,
  location: 'Ruộng số 1',
  estimated_quantity: 500,
  estimated_price: 16000,
  trader_id: trader.user_id,
  product_listing_id: product_listing.id,
  status: 0
)
puts 'Seeded marketplace harvests!' 