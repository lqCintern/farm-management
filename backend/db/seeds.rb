# Xóa dữ liệu cũ
puts "Clearing old data..."
CropAnimal.destroy_all
FarmMaterial.destroy_all
puts "Old data cleared!"


# Tạo dữ liệu mẫu cho bảng crop_animals
puts "Seeding crop_animals..."
CropAnimal.create!(
  crop_type: 1,
  name: "Lúa",
  area: 100,
  start_date: "2025-01-01",
  end_date: "2025-12-31"
)

CropAnimal.create!(
  crop_type: 2,
  name: "Ngô",
  area: 50,
  start_date: "2025-02-01",
  end_date: "2025-11-30"
)

puts "Crop animals seeded!"

# Tạo dữ liệu mẫu cho bảng farm_materials
puts "Seeding farm_materials..."
FarmMaterial.create!(
  name: "Phân bón NPK",
  user_id: User.first.id,
  material_id: 101,
  quantity: 500,
  last_updated: Time.now
)

FarmMaterial.create!(
  name: "Thuốc trừ sâu",
  user_id: User.first.id,
  material_id: 102,
  quantity: 200,
  last_updated: Time.now
)

puts "Farm materials seeded!"
