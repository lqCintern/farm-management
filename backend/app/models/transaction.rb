class Transaction < ApplicationRecord
    belongs_to :user, foreign_key: :user_id

    validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :date, presence: true

    enum :transaction_type, {
    income: 1,
    expense: 2,
    transfer: 3
  }
end
