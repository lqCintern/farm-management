module Models::Labor
  class LaborAssignment < Models::ApplicationRecord
    self.table_name = "labor_assignments"

    # Relationships
    belongs_to :labor_request, class_name: "Labor::LaborRequest"
    belongs_to :worker, class_name: "User", foreign_key: :worker_id, primary_key: :user_id
    belongs_to :home_household, class_name: "Labor::FarmHousehold",
               foreign_key: :home_household_id

    has_many :exchange_transactions, class_name: "Labor::LaborExchangeTransaction",
             dependent: :destroy

    # Validations
    validates :labor_request_id, presence: true
    validates :worker_id, presence: true
    validates :home_household_id, presence: true
    validates :work_date, presence: true
    validates :worker_id, uniqueness: { scope: [ :labor_request_id, :work_date ],
                                      message: "đã được phân công cho yêu cầu này vào ngày đã chọn" }
    validate :work_date_within_request_range
    validate :worker_availability

    # Enums
    enum :status, { assigned: 0, worker_reported: 1, completed: 2, missed: 3, rejected: 4 }

    # Callbacks
    after_create :update_worker_availability
    after_save :process_labor_exchange, if: -> { saved_change_to_status? && completed? }

    # Scopes
    scope :for_date, ->(date) { where(work_date: date) }
    scope :upcoming, -> { where("work_date >= ?", Date.today).order(work_date: :asc) }
    scope :past, -> { where("work_date < ?", Date.today).order(work_date: :desc) }

    # Methods
    def complete!(hours = nil, notes = nil)
      self.hours_worked = hours if hours.present?
      self.notes = notes if notes.present?
      self.status = :completed
      save
    end

    def reject!(reason = nil)
      self.notes = reason if reason.present?
      self.status = :rejected
      save
    end

    def mark_as_missed!(reason = nil)
      self.notes = reason if reason.present?
      self.status = :missed
      save
    end

    def rate_worker!(rating)
      update(worker_rating: rating)
    end

    def rate_farmer!(rating)
      update(farmer_rating: rating)
    end

    def requesting_household
      labor_request.requesting_household
    end

    private

    def work_date_within_request_range
      return if work_date.blank? || labor_request.blank?

      unless work_date.between?(labor_request.start_date, labor_request.end_date)
        errors.add(:work_date, "phải nằm trong khoảng thời gian của yêu cầu")
      end
    end

    def worker_availability
      return if worker_id.blank? || work_date.blank?

      # Kiểm tra xem worker có đang được phân công vào ngày đó không
      existing = Models::Labor::LaborAssignment.where(worker_id: worker_id, work_date: work_date)
                                      .where.not(id: id) # Loại trừ assignment hiện tại

      if existing.exists?
        errors.add(:worker_id, "đã có lịch làm việc khác vào ngày này")
      end
    end

    def update_worker_availability
      worker_profile = Models::Labor::WorkerProfile.find_by(user_id: worker_id)
      worker_profile&.mark_as_busy! if work_date == Date.today
    end

    def process_labor_exchange
      return unless completed?
      return if hours_worked.blank? || hours_worked <= 0
      # Thêm kiểm tra để tránh xử lý trùng lặp
      return if exchange_processed?

      # Chỉ xử lý đổi công nếu yêu cầu là loại exchange hoặc mixed
      return unless [ "exchange", "mixed" ].include?(labor_request.request_type)

      # Tìm hoặc tạo labor_exchange giữa hai hộ
      exchange = Models::Labor::LaborExchange.find_or_create_between(
        home_household_id,
        labor_request.requesting_household_id
      )

      # Sử dụng work_units thay vì hours_worked cho đổi công
      # Hoặc tiếp tục sử dụng hours_worked nếu muốn tính chính xác theo giờ
      exchange.add_transaction(self, work_units || hours_worked, labor_request.requesting_household_id)

      # Đánh dấu đã xử lý để tránh trùng lặp
      update_column(:exchange_processed, true)
    end
  end
end
