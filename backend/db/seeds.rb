if User.exists?
  user = User.first
  
  # Tạo vụ trồng dứa vụ Xuân-Hè
  PineappleCrop.create!(
    user_id: user.id,
    name: "Vụ Dứa Xuân-Hè 2024",
    crop_type: 0, # pineapple
    field_area: 5000, # 0.5 ha
    planting_date: "2024-03-15",
    season_type: "Xuân-Hè",
    planting_density: 60000, # cây/ha
    current_stage: :planting,
    status: :active,
    description: "Vụ dứa xuân hè thử nghiệm",
    variety: "Queen",
    source: "Tự nhân giống"
  )
  
  # Tạo vụ trồng dứa vụ Thu-Đông
  PineappleCrop.create!(
    user_id: user.id,
    name: "Vụ Dứa Thu-Đông 2024",
    crop_type: 0, # pineapple
    field_area: 7000, # 0.7 ha
    planting_date: "2024-10-20",
    season_type: "Thu-Đông",
    planting_density: 55000, # cây/ha
    current_stage: :preparation,
    status: :planning,
    description: "Vụ dứa thu đông thử nghiệm",
    variety: "Cayenne",
    source: "Mua từ trại giống ABC"
  )
end


# Tạo templates mặc định cho quy trình trồng dứa
default_templates = [
  # Giai đoạn chuẩn bị đất (preparation)
  {
    name: "Cày xới đất lần 1",
    description: "Cày xới toàn bộ diện tích, làm tơi đất",
    activity_type: 0, # soil_preparation
    stage: 0, # preparation
    day_offset: 0,
    duration_days: 3,
    is_required: true
  },
  {
    name: "Cày lần 2, lên luống",
    description: "Cày lần 2, lên luống để chuẩn bị trồng",
    activity_type: 0, # soil_preparation
    stage: 0, # preparation
    day_offset: 10,
    duration_days: 5,
    is_required: true
  },
  {
    name: "Xác định mật độ trồng",
    description: "Xác định mật độ trồng (55.000–65.000 cây/ha)",
    activity_type: 0, # soil_preparation
    stage: 0, # preparation
    day_offset: 20,
    duration_days: 1,
    is_required: true
  },
  
  # Giai đoạn chuẩn bị giống (seedling_preparation)
  {
    name: "Thu gom chồi giống",
    description: "Thu gom và chuẩn bị chồi giống",
    activity_type: 1, # planting
    stage: 1, # seedling_preparation
    day_offset: 0,
    duration_days: 5,
    is_required: true
  },
  {
    name: "Mua phân bón và vật tư",
    description: "Mua phân bón, lân, nilon phủ gốc",
    activity_type: 2, # fertilizing
    stage: 1, # seedling_preparation
    day_offset: 6,
    duration_days: 2,
    is_required: true
  },
  {
    name: "Bón phân lót",
    description: "Bón phân lót trước khi trồng",
    activity_type: 2, # fertilizing
    stage: 1, # seedling_preparation
    day_offset: 10,
    duration_days: 2,
    is_required: true
  },
  
  # Giai đoạn trồng (planting)
  {
    name: "Trồng chồi",
    description: "Trồng chồi đúng kỹ thuật, đúng mật độ",
    activity_type: 1, # planting
    stage: 2, # planting
    day_offset: 0,
    duration_days: 2,
    is_required: true
  },
  
  # Và các template cho giai đoạn khác...
]

default_templates.each do |template_data|
  PineappleActivityTemplate.create!(template_data)
end
