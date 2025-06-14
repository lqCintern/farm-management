module Labor
  module Models
    class LaborRequest < ApplicationRecord
    self.table_name = "labor_requests"

    # Relationships
    belongs_to :requesting_household, class_name: "Labor::FarmHousehold",
               foreign_key: :requesting_household_id
    belongs_to :providing_household, class_name: "Labor::FarmHousehold",
               foreign_key: :providing_household_id, optional: true
    belongs_to :farm_activity, optional: true
    belongs_to :parent_request, class_name: "Labor::LaborRequest", optional: true

    has_many :child_requests, class_name: "Labor::LaborRequest", foreign_key: "parent_request_id", dependent: :destroy
    has_many :assignments, class_name: "Labor::LaborAssignment",
             foreign_key: :labor_request_id, dependent: :destroy

    # Validations
    validates :title, presence: true
    validates :requesting_household_id, presence: true
    validates :workers_needed, numericality: { greater_than: 0 }, allow_nil: true
    validates :start_date, presence: true
    validates :end_date, presence: true
    validate :end_date_after_start_date
    validate :providing_household_different_from_requesting

    # Enums
    enum :request_type, { exchange: 0, paid: 1, mixed: 2 }
    enum :status, { pending: 0, accepted: 1, declined: 2, completed: 3, cancelled: 4 }

    # Scopes
    scope :active, -> { where(status: [ :pending, :accepted ]) }
    scope :today_or_future, -> { where("start_date >= ?", Date.today) }
    scope :upcoming, -> { active.today_or_future.order(start_date: :asc, start_time: :asc) }
    scope :public_requests, -> { where(is_public: true) }
    scope :pending_requests, -> { where(status: :pending) }

    # Methods
    def days_range
      (start_date..end_date).to_a
    end

    def accept!
      update(status: :accepted)
    end

    def decline!
      update(status: :declined)
    end

    def complete!
      if assignments.where.not(status: :completed).exists?
        errors.add(:base, "Không thể hoàn thành yêu cầu khi còn công việc chưa hoàn thành")
        return false
      end

      update(status: :completed)
    end

    def cancel!
      unless [ :pending, :accepted ].include?(status.to_sym)
        errors.add(:base, "Chỉ có thể hủy yêu cầu đang chờ hoặc đã chấp nhận")
        return false
      end

      Labor::LaborAssignment.transaction do
        assignments.update_all(status: :rejected)
        update(status: :cancelled)
      end

      true
    end

    def assigned_workers_count
      assignments.count
    end

    def workers_still_needed
      return nil if workers_needed.nil?
      [ workers_needed - assigned_workers_count, 0 ].max
    end

    # Đây có phải yêu cầu gốc không
    def original_request?
      parent_request_id.nil?
    end

    # Tìm các yêu cầu liên quan trong cùng nhóm
    def related_requests
      return self.class.where(request_group_id: request_group_id).where.not(id: id) if request_group_id.present?
      []
    end

    # Kiểm tra xem yêu cầu này có thể được chấp nhận bởi household đã cho không
    def can_be_accepted_by?(household_id)
      # Nếu household được chỉ định cụ thể
      return true if providing_household_id == household_id

      # Nếu đây là yêu cầu công khai
      if is_public && providing_household_id.nil?
        # Kiểm tra nếu household này chưa tham gia
        if original_request?
          !child_requests.exists?(providing_household_id: household_id)
        else
          parent = parent_request
          !parent.child_requests.exists?(providing_household_id: household_id)
        end
      else
        false
      end
    end

    # Kiểm tra xem đã đạt số lượng acceptor tối đa chưa
    def max_acceptors_reached?
      return false if max_acceptors.nil?

      accepted_count = if original_request?
        child_requests.where(status: [ :accepted, :completed ]).count
      else
        parent_request.child_requests.where(status: [ :accepted, :completed ]).count
      end

      accepted_count >= max_acceptors
    end

    # Lấy thông tin tổng quan về nhóm yêu cầu
    def group_status
      return nil unless request_group_id.present?

      group_requests = self.class.where(request_group_id: request_group_id)
      {
        total: group_requests.count,
        accepted: group_requests.where(status: :accepted).count,
        declined: group_requests.where(status: :declined).count,
        pending: group_requests.where(status: :pending).count,
        completed: group_requests.where(status: :completed).count
      }
    end

    private

    def end_date_after_start_date
      return if end_date.blank? || start_date.blank?

      if end_date < start_date
        errors.add(:end_date, "phải sau ngày bắt đầu")
      end
    end

    def providing_household_different_from_requesting
      return if providing_household_id.blank?

      if providing_household_id == requesting_household_id
        errors.add(:providing_household_id, "không thể giống với hộ yêu cầu")
      end
    end
      end
  end
end