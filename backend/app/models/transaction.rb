class Transaction < ApplicationRecord
    belongs_to :user, foreign_key: :user_id

    validates :type, presence: true
    validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :date, presence: true
end
