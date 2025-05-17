class ProductListing < ApplicationRecord
  belongs_to :user, primary_key: :user_id
  belongs_to :crop_animal, optional: true
  
  has_many :product_images, -> { order(position: :asc) }, dependent: :destroy
  has_many :product_orders, dependent: :destroy
  has_many :conversations, dependent: :nullify
  
  accepts_nested_attributes_for :product_images, allow_destroy: true, reject_if: :all_blank
  
  # Validations
  validates :title, presence: true
  validates :product_type, presence: true
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
  validates :average_size, numericality: { greater_than: 0 }, allow_nil: true
  validates :price_expectation, numericality: { greater_than: 0 }, allow_nil: true
  
  attr_accessor :min_size, :max_size

  # Đảm bảo ngày thu hoạch hợp lệ
  validate :validate_harvest_dates
  
    # Định nghĩa trạng thái bằng hằng số
  STATUS_DRAFT = 0
  STATUS_ACTIVE = 1
  STATUS_SOLD = 2
  STATUS_HIDDEN = 3

  # Danh sách trạng thái
  STATUSES = {
    draft: STATUS_DRAFT,
    active: STATUS_ACTIVE,
    sold: STATUS_SOLD,
    hidden: STATUS_HIDDEN
  }.freeze
  # Enum
  # Scopes
  scope :published, -> { where(status: STATUS_ACTIVE) }
  scope :draft, -> { where(status: STATUS_DRAFT) }
  scope :sold, -> { where(status: STATUS_SOLD) }
  scope :hidden, -> { where(status: STATUS_HIDDEN) }

  # Instance Methods
  def status_name
    STATUSES.key(status)
  end

  def draft?
    status == STATUS_DRAFT
  end

  def active?
    status == STATUS_ACTIVE
  end

  def sold?
    status == STATUS_SOLD
  end

  def hidden?
    status == STATUS_HIDDEN
  end
  
  # Scopes
  scope :by_product_type, -> (type) { where(product_type: type) if type.present? }
  scope :by_location, -> (province) { where(province: province) if province.present? }
  scope :by_price_range, -> (min, max) { 
    where("price_expectation >= ? AND price_expectation <= ?", min, max) if min.present? && max.present?
  }
  scope :ready_to_harvest, -> { 
    where("harvest_start_date <= ? AND harvest_end_date >= ?", Date.today, Date.today)
  }
  scope :for_user, -> (user_id) { where(user_id: user_id) }
  
  # Callbacks
  before_create :set_default_title
  
  # Instance Methods
  def increment_view_count!
    update_column(:view_count, view_count + 1)
  end
  
  def increment_message_count!
    update_column(:message_count, message_count + 1)
  end
  
  def increment_order_count!
    update_column(:order_count, order_count + 1)
  end
  
  def estimate_total_weight
    return total_weight if total_weight.present?
    return nil if quantity.nil? || average_size.nil?
    
    # Chuyển đổi từ gram sang kg và nhân với số lượng
    (quantity * average_size) / 1000.0
  end
  
  def has_been_ordered?
    product_orders.where.not(status: :rejected).exists?
  end
  
  def seller
    user
  end
  
  def seller_name
    user&.fullname || user&.user_name
  end
  
  def location_text
    [address, ward, district, province].compact.join(', ')
  end
  
  def google_maps_url
    return nil unless latitude.present? && longitude.present?
    "https://www.google.com/maps?q=#{latitude},#{longitude}"
  end
  
  def as_json(options = {})
    super(options).merge(
      estimated_weight: estimate_total_weight,
      seller_name: seller_name,
      location_text: location_text,
      google_maps_url: google_maps_url,
      thumbnail: product_images.first&.image_url
    )
  end
  
  private
  
  def validate_harvest_dates
    return if harvest_start_date.nil? || harvest_end_date.nil?
    
    if harvest_end_date < harvest_start_date
      errors.add(:harvest_end_date, "phải sau ngày bắt đầu thu hoạch")
    end
  end
  
  def set_default_title
    return if title.present?
    
    title_parts = []
    title_parts << "Dứa #{product_type} sẵn thu"
    title_parts << "- #{quantity} quả" if quantity.present?
    title_parts << "tại #{province}" if province.present?
    
    self.title = title_parts.join(' ')
  end
end
