module Models::Farming
  class PineappleCrop < Models::ApplicationRecord
    # Relationships
    belongs_to :user
    belongs_to :field, class_name: "Farming::Field", optional: true
    has_many :farm_activities, class_name: "Farming::FarmActivity", foreign_key: :crop_animal_id, dependent: :destroy
    has_many :harvests, class_name: "Farming::Harvest", foreign_key: :crop_id, dependent: :destroy
    has_many :product_listings, dependent: :nullify

    # Validations
    validates :name, :status, presence: true
    validates :planting_density, numericality: { greater_than: 0, allow_nil: true }

    # Enums
    enum :status, { planning: 0, active: 1, harvested: 2, terminated: 3 }
    enum :current_stage, {
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
    }

    # Scopes
    scope :in_stage, ->(stage) { where(current_stage: stage) }
    scope :spring_summer, -> { where(season_type: "Xuân-Hè") }
    scope :fall_winter, -> { where(season_type: "Thu-Đông") }
    scope :coming_harvest, -> { where("harvest_date >= ? AND harvest_date <= ?", Date.today, 3.months.from_now) }

    # Callback để tự động tính toán ngày dự kiến thu hoạch khi xác định ngày trồng
    before_save :calculate_harvest_date, if: -> { planting_date_changed? && season_type.present? }

    # Methods

    # Chuyển sang giai đoạn tiếp theo
    def advance_to_next_stage
      return false if current_stage == "field_cleaning" # Giai đoạn cuối cùng

      current_index = Farming::PineappleCrop.current_stages[current_stage]
      next_stage = Farming::PineappleCrop.current_stages.key(current_index + 1)

      # Cập nhật giai đoạn và ngày bắt đầu giai đoạn
      update(
        current_stage: next_stage,
        current_stage_start_date: Date.today
      )

      # Nếu chuyển sang giai đoạn thu hoạch, cập nhật trạng thái
      update(status: :harvested) if next_stage == "harvesting"

      # Cập nhật % hoàn thành
      update_completion_percentage

      true
    end

    # Cập nhật % hoàn thành dựa trên giai đoạn hiện tại
    def update_completion_percentage
      total_stages = 12 # Tổng số giai đoạn
      current_index = Farming::PineappleCrop.current_stages[current_stage]
      percentage = ((current_index + 1).to_f / total_stages * 100).round(2)
      update(completion_percentage: percentage)
    end

    # Hàm tính thời gian tham chiếu cho các loại hoạt động
    def get_reference_date_for_stage(stage)
      case stage.to_s
      when "preparation"
        land_preparation_date || Date.today
      when "seedling_preparation"
        (land_preparation_date || Date.today) + 15.days
      when "planting"
        planting_date || Date.today
      when "leaf_tying"
        tie_date || (planting_date + 5.months if planting_date.present?)
      when "first_fertilizing"
        planting_date.present? ? (planting_date + 2.months) : Date.today
      when "second_fertilizing"
        planting_date.present? ? (planting_date + 6.months) : Date.today
      when "flower_treatment"
        flower_treatment_date || (planting_date + 10.months if planting_date.present?)
      when "sun_protection"
        expected_flower_date || (planting_date + 12.months if planting_date.present?)
      when "fruit_development"
        expected_flower_date.present? ? (expected_flower_date + 2.months) : Date.today
      when "harvesting"
        harvest_date || Date.today
      when "sprout_collection"
        harvest_date.present? ? (harvest_date + 15.days) : Date.today
      when "field_cleaning"
        harvest_date.present? ? (harvest_date + 1.month) : Date.today
      else
        Date.today
      end
    end

    private

    # Tính toán ngày dự kiến thu hoạch dựa trên ngày trồng và mùa vụ
    def calculate_harvest_date
      return unless planting_date.present? && season_type.present?

      case season_type
      when "Xuân-Hè"
        # Thường trồng tháng 2-5, thu hoạch sau 15-18 tháng (tháng 8-10 năm sau)
        self.harvest_date = planting_date + 18.months
      when "Thu-Đông"
        # Thường trồng tháng 10-12, thu hoạch sau 16-18 tháng (tháng 1-4 sau 2 năm)
        self.harvest_date = planting_date + 16.months
      end
    end
  end
end
