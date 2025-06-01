class CropAnimal < ApplicationRecord
  belongs_to :user
  has_many :farm_activities, foreign_key: :crop_animal_id, dependent: :destroy
  has_many :sales, foreign_key: :crop_id, dependent: :destroy
  has_many :harvests, foreign_key: :crop_id, dependent: :destroy
  has_many :product_listings, dependent: :nullify

  belongs_to :field, optional: true

  # Hằng số cho trạng thái
  STATUS = {
    active: 0,
    harvested: 1,
    failed: 2
  }.freeze

  # Validation
  validates :crop_type, presence: true
  validates :name, presence: true, length: { maximum: 255 }
  validates :field_area, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :planting_date, presence: true
  validates :harvest_date, presence: true
  validates :user_id, presence: true
  validates :status, inclusion: { in: STATUS.values }
  validates :field_id, presence: true

  # Scope for filtering
  scope :active, -> { where(status: STATUS[:active]) }
  scope :crops, -> { where(crop_type: 0) }
  scope :animals, -> { where(crop_type: 1) }

  # Getter cho trạng thái
  def status_text
    STATUS.key(status).to_s.humanize
  end

  # Setter cho trạng thái
  def status=(value)
    super(STATUS[value.to_sym] || value)
  end
  # Method để lấy tọa độ từ field
  def coordinates
    field&.coordinates
  end

  # Method để lấy area từ field
  def area
    field&.area || 0
  end

  def crop_type_text
    case crop_type
    when 0
      "Cây trồng"
    when 1
      "Vật nuôi"
    else
      "Không xác định"
    end
  end
end
