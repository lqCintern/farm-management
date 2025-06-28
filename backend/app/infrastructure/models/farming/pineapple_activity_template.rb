module Models::Farming
  class PineappleActivityTemplate < Models::ApplicationRecord
    belongs_to :user, optional: true

    enum :stage, {
      preparation: 0,             # Chuẩn bị đất & mật độ trồng
      seedling_preparation: 1,    # Chuẩn bị giống & vật tư
      planting: 2,                # Trồng dứa
      leaf_tying: 3,              # Buộc lá (tránh chính vụ)
      first_fertilizing: 4,       # Bón phân thúc lần 1
      second_fertilizing: 5,      # Bón phân thúc lần 2
      flower_treatment: 6,        # Xử lý ra hoa
      sun_protection: 7,          # Buộc tránh nắng / Che lưới đen
      fruit_development: 8,       # Bón phân thúc quả lớn
      harvesting: 9,              # Thu hoạch
      sprout_collection: 10,      # Tách chồi giống
      field_cleaning: 11          # Dọn vườn
    }, prefix: true

    enum :activity_type, {
      soil_preparation: 0,      # Chuẩn bị đất
      seedling_preparation: 1,  # Chuẩn bị giống & vật tư
      planting: 2,              # Trồng dứa
      leaf_tying: 3,            # Buộc lá
      fertilizing: 4,           # Bón phân
      pesticide: 5,             # Phun thuốc
      sun_protection: 6,        # Che nắng
      fruit_development: 7,     # Thúc quả
      harvesting: 8,            # Thu hoạch
      sprout_collection: 9,     # Tách chồi
      field_cleaning: 10,       # Dọn vườn
      watering: 11,             # Tưới nước
      weeding: 12,              # Làm cỏ
      other: 13                 # Khác
    }, prefix: true

    validates :name, :activity_type, :stage, presence: true
    validates :day_offset, :duration_days, presence: true

    scope :default_templates, -> { where(user_id: nil) }
    scope :for_stage, ->(stage) { where(stage: stage) }
    scope :for_season, ->(season) { where("season_specific IS NULL OR season_specific = ?", season) }
    scope :required_only, -> { where(is_required: true) }

    has_many :template_activity_materials, dependent: :destroy, class_name: "Farming::TemplateActivityMaterial"
    has_many :farm_materials, through: :template_activity_materials, class_name: "Farming::FarmMaterial"

    # Tạo mẫu hoạt động dựa trên template
    def create_activity_from_template(pineapple_crop, reference_date)
      # Tính ngày bắt đầu và kết thúc dựa trên ngày tham chiếu
      start_date = reference_date + day_offset.days
      end_date = start_date + duration_days.days

      # Tạo activity mới
      Farming::FarmActivity.new(
        user_id: pineapple_crop.user_id,
        crop_animal_id: pineapple_crop.id,
        field_id: pineapple_crop.field_id,
        activity_type: activity_type,
        description: name,
        status: "pending",
        start_date: start_date,
        end_date: end_date,
        frequency: "once"
      )
    end
  end
end
