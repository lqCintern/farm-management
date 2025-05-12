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
    day_offset: -30, # Trước trồng 1 tháng
    duration_days: 3,
    is_required: true,
    season_specific: nil # Áp dụng cho cả 2 vụ
  },
  {
    name: "Cày lần 2, lên luống",
    description: "Cày lần 2, lên luống để chuẩn bị trồng",
    activity_type: 0, # soil_preparation
    stage: 0, # preparation
    day_offset: -20,
    duration_days: 5,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Xác định mật độ trồng",
    description: "Xác định mật độ trồng (55.000–65.000 cây/ha)",
    activity_type: 0, # soil_preparation
    stage: 0, # preparation
    day_offset: -10,
    duration_days: 1,
    is_required: true,
    season_specific: nil
  },
  
  # Giai đoạn chuẩn bị giống (seedling_preparation)
  {
    name: "Thu gom chồi giống",
    description: "Thu gom và chuẩn bị chồi giống",
    activity_type: 1, # planting
    stage: 1, # seedling_preparation
    day_offset: -15,
    duration_days: 5,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Mua phân bón và vật tư",
    description: "Mua phân bón, lân, nilon phủ gốc",
    activity_type: 2, # fertilizing
    stage: 1, # seedling_preparation
    day_offset: -10,
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Bón phân lót",
    description: "Bón phân lót trước khi trồng",
    activity_type: 2, # fertilizing
    stage: 1, # seedling_preparation
    day_offset: -5,
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  
  # Giai đoạn trồng (planting)
  {
    name: "Trồng chồi",
    description: "Trồng chồi đúng kỹ thuật, đúng mật độ",
    activity_type: 1, # planting
    stage: 2, # planting
    day_offset: 0,
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  
  # Giai đoạn chăm sóc (growing)
  {
    name: "Buộc lá",
    description: "Buộc toàn bộ lá để hạn chế quang hợp, tránh cây ra hoa chính vụ",
    activity_type: 3, # caring
    stage: 3, # growing
    day_offset: 120, # Sau khi trồng 4 tháng
    duration_days: 10,
    is_required: true,
    season_specific: "Xuân-Hè" # Chỉ áp dụng cho vụ Xuân-Hè
  },
  {
    name: "Bón phân thúc lần 1",
    description: "Bón phân thúc lần 1 sau khi trồng 4-5 tháng",
    activity_type: 2, # fertilizing
    stage: 3, # growing
    day_offset: 150, # Sau khi trồng 5 tháng
    duration_days: 3,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Làm cỏ, vun gốc",
    description: "Làm cỏ và vun gốc cho cây",
    activity_type: 3, # caring
    stage: 3, # growing
    day_offset: 90, # Sau khi trồng 3 tháng
    duration_days: 5,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Tưới nước định kỳ",
    description: "Tưới nước định kỳ trong mùa khô",
    activity_type: 3, # caring
    stage: 3, # growing
    day_offset: 60, # Bắt đầu tưới sau trồng 2 tháng
    duration_days: 180, # Kéo dài 6 tháng
    is_required: false, # Tùy thuộc điều kiện thời tiết
    season_specific: nil
  },
  {
    name: "Bón phân thúc lần 2",
    description: "Bón phân thúc lần 2 trước khi xử lý ra hoa 1 tháng",
    activity_type: 2, # fertilizing
    stage: 3, # growing
    day_offset: 270, # Trước xử lý ra hoa khoảng 1 tháng
    duration_days: 3,
    is_required: true,
    season_specific: nil
  },
  
  # Giai đoạn ra hoa (flowering)
  {
    name: "Cắt dây buộc cây",
    description: "Cắt dây buộc cây trước khi xử lý ra hoa (chỉ áp dụng vụ Xuân - Hè)",
    activity_type: 3, # caring
    stage: 4, # flowering
    day_offset: -15, # Trước xử lý ra hoa 15 ngày
    duration_days: 2,
    is_required: true,
    season_specific: "Xuân-Hè"
  },
  {
    name: "Xử lý ra hoa",
    description: "Phun thuốc kích thích sinh trưởng lên ngọn để cây ra hoa đồng loạt",
    activity_type: 3, # caring
    stage: 4, # flowering
    day_offset: 0, # Ngày xử lý ra hoa chính
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Theo dõi ra hoa",
    description: "Theo dõi tình trạng ra hoa của cây",
    activity_type: 3, # caring
    stage: 4, # flowering
    day_offset: 15, # Sau xử lý ra hoa 15 ngày
    duration_days: 30, # Theo dõi trong 1 tháng
    is_required: true,
    season_specific: nil
  },
  
  # Giai đoạn phát triển quả (fruiting)
  {
    name: "Buộc tránh nắng/Che lưới đen",
    description: "Buộc ngọn hoặc che lưới đen để tránh nắng gắt cho quả",
    activity_type: 3, # caring
    stage: 5, # fruiting
    day_offset: 30, # Sau khi ra hoa 1 tháng
    duration_days: 5,
    is_required: false, # Tùy theo điều kiện thời tiết
    season_specific: nil
  },
  {
    name: "Bón phân thúc quả lớn",
    description: "Phun thuốc tăng trưởng quả giúp quả lớn, chín đều",
    activity_type: 2, # fertilizing
    stage: 5, # fruiting
    day_offset: 60, # Sau ra hoa 2 tháng
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Phun thuốc điều khiển độ chín",
    description: "Phun thuốc điều khiển độ chín, giúp quả chín đồng đều, đúng thời điểm",
    activity_type: 3, # caring
    stage: 5, # fruiting
    day_offset: 120, # Sau ra hoa 4 tháng, gần thu hoạch
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Phòng trừ sâu bệnh",
    description: "Kiểm tra và phun thuốc phòng trừ sâu bệnh hại cho quả",
    activity_type: 3, # caring
    stage: 5, # fruiting
    day_offset: 90, # Sau ra hoa 3 tháng
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  
  # Giai đoạn thu hoạch (harvesting)
  {
    name: "Chuẩn bị dụng cụ thu hoạch",
    description: "Chuẩn bị dụng cụ, phương tiện cho thu hoạch",
    activity_type: 4, # harvesting
    stage: 6, # harvesting
    day_offset: -7, # Trước thu hoạch 1 tuần
    duration_days: 2,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Thu hoạch chính",
    description: "Thu hoạch quả chín đạt tiêu chuẩn",
    activity_type: 4, # harvesting
    stage: 6, # harvesting
    day_offset: 0, # Ngày thu hoạch chính
    duration_days: 14, # Kéo dài 2 tuần
    is_required: true,
    season_specific: nil
  },
  {
    name: "Thu hoạch đợt phụ",
    description: "Thu hoạch quả chín muộn",
    activity_type: 4, # harvesting
    stage: 6, # harvesting
    day_offset: 20, # Sau thu hoạch chính 20 ngày
    duration_days: 10,
    is_required: false,
    season_specific: nil
  },
  
  # Giai đoạn sau thu hoạch (completed)
  {
    name: "Tách chồi giống",
    description: "Chọn và tách chồi khỏe làm giống cho vụ tiếp theo",
    activity_type: 5, # post_harvest
    stage: 7, # completed
    day_offset: 150, # Sau thu hoạch 5 tháng
    duration_days: 10,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Dọn vườn",
    description: "Thu gom tàn dư thực vật, xử lý đất chuẩn bị cho vụ sau",
    activity_type: 5, # post_harvest
    stage: 7, # completed
    day_offset: 60, # Sau thu hoạch 2 tháng
    duration_days: 5,
    is_required: true,
    season_specific: nil
  },
  {
    name: "Làm đất nghỉ ngơi",
    description: "Cày xới, xử lý đất để nghỉ ngơi và chuẩn bị cho vụ mới",
    activity_type: 0, # soil_preparation
    stage: 7, # completed
    day_offset: 90, # Sau thu hoạch 3 tháng
    duration_days: 5,
    is_required: true,
    season_specific: nil
  }
]

# Xóa templates cũ nếu có
PineappleActivityTemplate.where(user_id: nil).delete_all

# Tạo templates mới
default_templates.each do |template_data|
  PineappleActivityTemplate.create!(template_data)
end

puts "Created #{PineappleActivityTemplate.count} pineapple activity templates"