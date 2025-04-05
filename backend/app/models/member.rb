class Member < ApplicationRecord
    # Quan hệ
    belongs_to :user, foreign_key: :user_id
    belongs_to :cooperative, foreign_key: :coop_id
  
    # Validation
    validates :join_date, presence: true
  end