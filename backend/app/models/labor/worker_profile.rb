module Labor
  class WorkerProfile < ApplicationRecord
    self.table_name = "labor_worker_profiles"
    
    # Relationships
    belongs_to :user, foreign_key: :user_id, primary_key: :user_id
    has_many :labor_assignments, class_name: "Labor::LaborAssignment", 
             foreign_key: :worker_id, primary_key: :user_id
    
    # Validations
    validates :user_id, presence: true, uniqueness: true
    
    # Enums
    enum :availability, { available: 0, busy: 1, unavailable: 2 }
    
    # Methods
    def household
      Labor::HouseholdWorker.find_by(worker_id: user_id)&.household
    end
    
    def mark_as_available!
      update(availability: :available)
    end
    
    def mark_as_busy!
      update(availability: :busy)
    end
    
    def mark_as_unavailable!
      update(availability: :unavailable)
    end
    
    def upcoming_assignments
      labor_assignments.where('work_date >= ?', Date.today)
                      .order(work_date: :asc, start_time: :asc)
    end
    
    def past_assignments
      labor_assignments.where('work_date < ?', Date.today)
                      .order(work_date: :desc, start_time: :desc)
    end
    
    def average_rating
      completed = labor_assignments.completed
      return nil if completed.empty?
      
      total_ratings = completed.where.not(worker_rating: nil).sum(:worker_rating)
      ratings_count = completed.where.not(worker_rating: nil).count
      
      ratings_count > 0 ? (total_ratings.to_f / ratings_count).round(1) : nil
    end
  end
end
