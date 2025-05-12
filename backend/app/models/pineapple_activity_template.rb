class PineappleActivityTemplate < ApplicationRecord
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
    soil_preparation: 0,
    planting: 1, 
    fertilizing: 2,
    watering: 3,
    pesticide: 4,
    pruning: 5,
    weeding: 6,
    harvesting: 7,
    other: 8
  }, prefix: true
  
  validates :name, :activity_type, :stage, presence: true
  validates :day_offset, :duration_days, presence: true
  
  scope :default_templates, -> { where(user_id: nil) }
  scope :for_stage, ->(stage) { where(stage: stage) }
  scope :for_season, ->(season) { where("season_specific IS NULL OR season_specific = ?", season) }
  scope :required_only, -> { where(is_required: true) }
end
