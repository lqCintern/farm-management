# db/seeds/labor_exchange_seed.rb
# Seed dữ liệu cho hệ thống đổi công

# Helper methods
def random_phone
  "0#{rand(9)}#{rand(10_000_000..99_999_999)}"
end

def random_date_future(days_from_now = 30)
  Date.today + rand(1..days_from_now).days
end

def random_time_only
  hour = rand(6..18)  # Giữa 6h sáng và 6h chiều
  minute = [ 0, 15, 30, 45 ].sample
  Time.new(2000, 1, 1, hour, minute, 0)
end

def hours_between(start_time, end_time)
  ((end_time - start_time) / 3600.0).round(1)
end

puts "=== BẮT ĐẦU TẠO DỮ LIỆU ĐỔI CÔNG ==="
puts "Kiểm tra dữ liệu hiện có..."

existing_users = User.count
existing_households = Labor::FarmHousehold.count
existing_activities = FarmActivity.count
existing_requests = Labor::LaborRequest.count
existing_assignments = Labor::LaborAssignment.count

puts "Dữ liệu hiện có: #{existing_users} users, #{existing_households} households"

# 1. Tạo 10 hộ gia đình mới với chủ hộ và người lao động
puts "\n=== TẠO HỘ GIA ĐÌNH + USER ==="
new_households = []
new_farmer_users = []
new_worker_users = []

# Đặt biến để theo dõi số lượng user đã bỏ qua
skipped_users = 0

10.times do |i|
  # Tạo chủ hộ
  begin
    farmer_user = User.create!(
      user_type: 0, # farmer
      user_name: "farmer_seed_#{i+1}",
      email: "farmer_seed_#{i+1}@example.com",
      password: "password123", # Sửa lại từ password_digest
      password_confirmation: "password123",
      fullname: "Nông dân #{i+1}",
      address: "Địa chỉ #{i+1}",
      phone: random_phone,
      status: 0
    )
    new_farmer_users << farmer_user
  rescue ActiveRecord::RecordInvalid => e
    puts "Bỏ qua chủ hộ #{i+1}: #{e.message}"
    skipped_users += 1
    next # Bỏ qua và tiếp tục vòng lặp
  end

  # Tạo người lao động
  begin
    worker_user = User.create!(
      user_type: 2, # worker
      user_name: "worker_seed_#{i+1}",
      email: "worker_seed_#{i+1}@example.com",
      password: "password123", # Sửa lại từ password_digest
      password_confirmation: "password123",
      fullname: "Lao động #{i+1}",
      address: "Địa chỉ #{i+1}",
      phone: random_phone,
      status: 0
    )
    new_worker_users << worker_user
  rescue ActiveRecord::RecordInvalid => e
    puts "Bỏ qua người lao động #{i+1}: #{e.message}"
    skipped_users += 1
    next # Bỏ qua và tiếp tục vòng lặp
  end

  # Tạo hộ gia đình
  household = Labor::FarmHousehold.create!(
    name: "Hộ Gia Đình #{i+1}",
    owner_id: farmer_user.user_id,
    description: "Hộ trồng dứa #{i+1}",
    province: [ "Ninh Bình", "Hải Phòng", "Hà Nội", "Thanh Hóa", "Nghệ An" ].sample,
    district: "Huyện #{i+1}",
    ward: "Xã #{i+1}",
    address: "Thôn #{i+1}"
  )
  new_households << household

  # Liên kết người lao động với hộ
  Labor::HouseholdWorker.create!(
    household_id: household.id,
    worker_id: worker_user.user_id,
    relationship: [ "Chủ hộ", "Vợ/Chồng", "Con", "Người làm thuê" ].sample,
    is_active: true,
    joined_date: Date.today - rand(30..365).days,
    notes: "Người lao động của hộ #{i+1}"
  )
end

puts "Đã tạo #{new_farmer_users.size} chủ hộ và #{new_worker_users.size} người lao động"
puts "Đã tạo #{new_households.size} hộ gia đình mới"
puts "Đã bỏ qua #{skipped_users} users do trùng lặp"

# 2. Tạo 5 hoạt động nông nghiệp cho mỗi hộ
puts "\n=== TẠO HOẠT ĐỘNG NÔNG NGHIỆP ==="
all_activities = []
crop_types = [ 1, 2, 3 ]
activity_types = FarmActivity.activity_types.keys

new_households.each do |household|
  # Tạo thửa ruộng cho hộ
  field = Field.create!(
    name: "Ruộng của #{household.name}",
    user_id: household.owner_id,
    coordinates: { "type": "Polygon", "coordinates": [ [ [ 105.1, 21.1 ], [ 105.2, 21.1 ], [ 105.2, 21.2 ], [ 105.1, 21.2 ], [ 105.1, 21.1 ] ] ] }.to_json,
    area: rand(100..1000),
    description: "Thửa ruộng của hộ #{household.id}",
    location: household.district
  )

  5.times do |i|
    start_date = Date.today + rand(1..30).days
    end_date = start_date + rand(10..60).days

    activity = FarmActivity.create!(
      crop_animal_id: crop_types.sample,
      activity_type: activity_types.sample,
      description: "Hoạt động #{i+1} của #{household.name}",
      frequency: rand(0..3),
      status: 0, # pending
      start_date: start_date,
      end_date: end_date,
      user_id: household.owner_id,
      field_id: field.id
    )
    all_activities << activity
    print "."
  end
end

puts "\nĐã tạo #{all_activities.size} hoạt động nông nghiệp"

# 3. Tạo yêu cầu đổi công từ mỗi hộ tới 3 hộ khác
puts "\n=== TẠO YÊU CẦU ĐỔI CÔNG ==="
all_requests = []

new_households.each do |requesting_household|
  # Lấy hoạt động của hộ này
  household_activities = all_activities.select { |a| a.user_id == requesting_household.owner_id }

  # Chọn 2 hoạt động để tạo yêu cầu
  selected_activities = household_activities.sample(2)

  selected_activities.each do |activity|
    # Chọn 3 hộ ngẫu nhiên (trừ hộ hiện tại)
    providing_households = new_households.reject { |h| h.id == requesting_household.id }.sample(3)

    providing_households.each do |providing_household|
      start_time = random_time_only
      end_time = random_time_only

      # Đảm bảo end_time > start_time
      while end_time <= start_time
        end_time = random_time_only
      end

      request = Labor::LaborRequest.create!(
        requesting_household_id: requesting_household.id,
        providing_household_id: providing_household.id,
        farm_activity_id: activity.id,
        title: "Hoạt động #{activity.start_date.strftime('%d/%m/%Y')}",
        description: "Cần giúp đỡ với #{activity.description}",
        workers_needed: rand(1..3),
        request_type: 1, # exchange type
        start_date: activity.start_date,
        end_date: activity.end_date,
        start_time: start_time,
        end_time: end_time,
        status: 2, # completed
        is_public: false,
        request_group_id: SecureRandom.uuid
      )
      all_requests << request
      print "."
    end
  end
end

puts "\nĐã tạo #{all_requests.size} yêu cầu đổi công"

# 4. Tạo assignment đã hoàn thành cho tất cả yêu cầu
puts "\n=== TẠO ASSIGNMENT ĐÃ HOÀN THÀNH ==="
all_assignments = []

all_requests.each do |request|
  # Tìm người lao động thuộc hộ cung cấp
  household_worker = Labor::HouseholdWorker.find_by(household_id: request.providing_household_id)

  if household_worker.nil?
    puts "Cảnh báo: Không tìm thấy người lao động cho hộ #{request.providing_household_id}"
    next
  end

  worker = User.find(household_worker.worker_id)

  # Tạo assignment với ngày làm việc trong khoảng thời gian của yêu cầu
  work_date = request.start_date + rand(0..(request.end_date - request.start_date).to_i).days

  # Kết hợp ngày làm việc với giờ từ request
  start_hour = request.start_time.hour
  start_min = request.start_time.min
  end_hour = request.end_time.hour
  end_min = request.end_time.min

  # Tạo thời gian kết hợp với work_date
  start_time = work_date.to_time.change(hour: start_hour, min: start_min)
  end_time = work_date.to_time.change(hour: end_hour, min: end_min)

  # Tính giờ làm việc giữa hai thời điểm
  hours_diff = hours_between(start_time, end_time)

  # Tính đơn vị công (0.5 cho < 6 giờ, 1.0 cho >= 6 giờ)
  work_units = hours_diff >= 6 ? 1.0 : 0.5

  assignment = Labor::LaborAssignment.create!(
    labor_request_id: request.id,
    worker_id: worker.user_id,
    home_household_id: request.providing_household_id,
    work_date: work_date,
    start_time: start_time,
    end_time: end_time,
    hours_worked: hours_diff,
    work_units: work_units,
    status: 2, # completed
    notes: "Assignment cho yêu cầu #{request.id}",
    worker_rating: rand(3..5),
    farmer_rating: rand(3..5),
    exchange_processed: false # Sẽ được xử lý ở bước tiếp theo
  )
  all_assignments << assignment
  print "."
end

puts "\nĐã tạo #{all_assignments.size} assignments hoàn thành"

# 5. Xử lý assignments để tính toán số dư đổi công
puts "\n=== XỬ LÝ GIAO DỊCH ĐỔI CÔNG ==="

all_assignments.each do |assignment|
  begin
    result = Labor::ExchangeService.process_completed_assignment(assignment)
    if result[:success]
      print "."
    else
      print "x"
    end
  rescue => e
    puts "\nLỗi khi xử lý assignment #{assignment.id}: #{e.message}"
  end
end

# 6. Tính lại số dư đổi công
puts "\n=== TÍNH LẠI SỐ DƯ ĐỔI CÔNG ==="

household_pairs = []
all_assignments.each do |assignment|
  requesting_household_id = assignment.labor_request.requesting_household_id
  providing_household_id = assignment.home_household_id

  pair = [ requesting_household_id, providing_household_id ].sort
  household_pairs << pair unless household_pairs.include?(pair)
end

household_pairs.uniq.each do |pair|
  begin
    result = Labor::ExchangeService.recalculate_balance(pair[0], pair[1])
    if result[:success]
      print "."
    else
      print "x"
    end
  rescue => e
    puts "\nLỗi khi tính lại số dư cho hộ #{pair[0]} và #{pair[1]}: #{e.message}"
  end
end

puts "\n\n=== KẾT QUẢ SEED DATA ==="
puts "Đã tạo #{new_farmer_users.size} chủ hộ, #{new_worker_users.size} người lao động"
puts "Đã tạo #{new_households.size} hộ gia đình với #{all_activities.size} hoạt động"
puts "Đã tạo #{all_requests.size} yêu cầu và #{all_assignments.size} assignments"
puts "Tổng số user: #{User.count} (#{User.count - existing_users} mới)"
puts "Tổng số household: #{Labor::FarmHousehold.count} (#{Labor::FarmHousehold.count - existing_households} mới)"
puts "Tổng số activity: #{FarmActivity.count} (#{FarmActivity.count - existing_activities} mới)"
puts "Tổng số request: #{Labor::LaborRequest.count} (#{Labor::LaborRequest.count - existing_requests} mới)"
puts "Tổng số assignment: #{Labor::LaborAssignment.count} (#{Labor::LaborAssignment.count - existing_assignments} mới)"
puts "=== HOÀN THÀNH ==="
