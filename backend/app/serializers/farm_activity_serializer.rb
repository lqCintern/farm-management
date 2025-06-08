class FarmActivitySerializer
  include JSONAPI::Serializer

  # Các thuộc tính cơ bản
  attributes :id, :activity_type, :description, :frequency, :status,
             :start_date, :end_date, :crop_animal_id, :created_at, :updated_at,
             :field_id, :actual_completion_date, :actual_notes

  # Thêm định nghĩa quan hệ
  has_many :farm_materials
  # Thêm định nghĩa quan hệ activity_materials - đây là phần đang bị thiếu
  has_many :activity_materials

  # Thêm các thuộc tính được tính toán
  attribute :status_label do |activity|
    case activity.status
    when "pending"
      "Chưa hoàn thành"
    when "completed"
      "Đã hoàn thành"
    when "cancelled"
      "Đã hủy"
    else
      activity.status
    end
  end

  attribute :status_details do |activity|
    today = Date.today
    start_date = activity.start_date
    end_date = activity.end_date

    {
      starting_soon: (start_date - today).to_i.between?(0, 3),
      ending_soon: (end_date - today).to_i.between?(0, 3),
      overdue: end_date < today && activity.status == "pending",
      overdue_days: [ 0, (today - end_date).to_i ].max
    }
  end
  
  # Thêm thuộc tính để biết hoạt động có yêu cầu vật tư hay không
  attribute :requires_materials do |activity|
    ["fertilizing", "pesticide", "planting"].include?(activity.activity_type)
  end
end
