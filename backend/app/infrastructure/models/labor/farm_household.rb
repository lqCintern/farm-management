module Models::Labor
  class FarmHousehold < Models::ApplicationRecord
    self.table_name = "labor_farm_households"

    # Relationships
    belongs_to :owner, class_name: "User", foreign_key: :owner_id, primary_key: :user_id

    has_many :household_workers, class_name: "Labor::HouseholdWorker",
             foreign_key: :household_id, dependent: :destroy
    has_many :workers, through: :household_workers, source: :worker

    has_many :outgoing_requests, class_name: "Labor::LaborRequest",
             foreign_key: :requesting_household_id, dependent: :destroy
    has_many :incoming_requests, class_name: "Labor::LaborRequest",
             foreign_key: :providing_household_id, dependent: :nullify

    has_many :worker_assignments, class_name: "Labor::LaborAssignment",
             foreign_key: :home_household_id, dependent: :nullify

    has_many :exchanges_as_a, class_name: "Labor::LaborExchange",
             foreign_key: :household_a_id, dependent: :destroy
    has_many :exchanges_as_b, class_name: "Labor::LaborExchange",
             foreign_key: :household_b_id, dependent: :destroy

    # Validations
    validates :name, presence: true
    validates :owner_id, presence: true

    # Methods
    def all_exchanges
      Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?", id, id)
    end

    def available_workers
      workers.joins(:labor_profile).where(labor_worker_profiles: { availability: :available })
    end

    def active_workers
      household_workers.where(is_active: true).map(&:worker)
    end

    def total_labor_balance
      positive = exchanges_as_a.sum(:hours_balance)
      negative = exchanges_as_b.sum(:hours_balance)
      positive - negative
    end

    def labor_balance_with(other_household)
      exchange = exchanges_as_a.find_by(household_b_id: other_household.id) ||
                 exchanges_as_b.find_by(household_a_id: other_household.id)

      return 0 unless exchange

      if exchange.household_a_id == id
        exchange.hours_balance
      else
        -exchange.hours_balance
      end
    end
  end
end
