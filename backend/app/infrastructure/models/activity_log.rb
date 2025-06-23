module Models
  class ActivityLog < Models::ApplicationRecord
    belongs_to :user
    belongs_to :target, polymorphic: true, optional: true
  end
end
