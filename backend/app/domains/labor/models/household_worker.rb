module Labor
  module Models
    class HouseholdWorker < ApplicationRecord
    self.table_name = "labor_household_workers"

    # Relationships
    belongs_to :household, class_name: "Labor::FarmHousehold"
    belongs_to :worker, class_name: "User", foreign_key: :worker_id, primary_key: :user_id

    # Validations
    validates :household_id, presence: true
    validates :worker_id, presence: true, uniqueness: { message: "đã thuộc về một hộ sản xuất khác" }

    # Callbacks
    after_create :create_worker_profile

    # Scopes
    scope :active, -> { where(is_active: true) }

    # Methods
    def create_worker_profile
      unless Labor::WorkerProfile.exists?(user_id: worker_id)
        Labor::WorkerProfile.create(user_id: worker_id)
      end
    end

    def activate!
      update(is_active: true)
    end

    def deactivate!
      update(is_active: false)
    end
      end
  end
end