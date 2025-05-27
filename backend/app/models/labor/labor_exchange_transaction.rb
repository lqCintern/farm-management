module Labor
  class LaborExchangeTransaction < ApplicationRecord
    self.table_name = "labor_exchange_transactions"
    
    # Relationships
    belongs_to :labor_exchange, class_name: "Labor::LaborExchange"
    belongs_to :labor_assignment, class_name: "Labor::LaborAssignment", optional: true
    
    # Validations
    validates :labor_exchange_id, presence: true
    validates :hours, presence: true
    validates :description, presence: true
  end
end
