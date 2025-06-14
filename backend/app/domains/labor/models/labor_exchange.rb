module Labor
  class LaborExchange < ApplicationRecord
    self.table_name = "labor_exchanges"

    # Relationships
    belongs_to :household_a, class_name: "Labor::FarmHousehold",
               foreign_key: :household_a_id
    belongs_to :household_b, class_name: "Labor::FarmHousehold",
               foreign_key: :household_b_id

    has_many :transactions, class_name: "Labor::LaborExchangeTransaction",
             foreign_key: :labor_exchange_id, dependent: :destroy

    # Validations
    validates :household_a_id, presence: true
    validates :household_b_id, presence: true
    validates :household_a_id, uniqueness: { scope: :household_b_id }
    validate :different_households

    # Class methods
    def self.find_or_create_between(household_a_id, household_b_id)
      # Sắp xếp ID để đảm bảo tính nhất quán
      if household_a_id > household_b_id
        household_a_id, household_b_id = household_b_id, household_a_id
      end

      exchange = find_by(household_a_id: household_a_id, household_b_id: household_b_id)

      unless exchange
        exchange = create(
          household_a_id: household_a_id,
          household_b_id: household_b_id,
          hours_balance: 0.0
        )
      end

      exchange
    end

    def self.find_by_households(household_a_id, household_b_id)
      # Tìm exchange giữa hai hộ, bất kể thứ tự household_a và household_b
      Labor::LaborExchange.where(
        "(household_a_id = ? AND household_b_id = ?) OR (household_a_id = ? AND household_b_id = ?)",
        household_a_id, household_b_id,
        household_b_id, household_a_id
      ).first
    end

    # Instance methods
    def add_transaction(labor_assignment, hours, description = nil)
      # Xác định hướng giao dịch
      worker_household_id = labor_assignment.home_household_id
      requesting_household_id = labor_assignment.requesting_household.id

      # Nếu worker từ household_b làm việc cho household_a, balance tăng
      # Nếu worker từ household_a làm việc cho household_b, balance giảm
      if worker_household_id == household_b_id && requesting_household_id == household_a_id
        transaction_hours = hours
      elsif worker_household_id == household_a_id && requesting_household_id == household_b_id
        transaction_hours = -hours
      else
        # Không phải giao dịch giữa hai hộ này
        return nil
      end

      transaction = nil

      self.class.transaction do
        # Cập nhật balance
        self.hours_balance += transaction_hours
        self.last_transaction_date = Time.current
        save!

        # Tạo giao dịch
        transaction = transactions.create!(
          labor_assignment_id: labor_assignment.id,
          hours: transaction_hours,
          description: description || "Giao dịch đổi công ngày #{labor_assignment.work_date}"
        )
      end

      transaction
    end

    def reset_balance!
      self.class.transaction do
        self.hours_balance = 0.0
        self.last_transaction_date = Time.current
        save!

        transactions.create!(
          labor_assignment_id: nil,
          hours: 0,
          description: "Đã reset công nợ giữa hai hộ"
        )
      end
    end

    private

    def different_households
      if household_a_id == household_b_id
        errors.add(:base, "Không thể tạo giao dịch đổi công giữa cùng một hộ")
      end
    end
  end
end
