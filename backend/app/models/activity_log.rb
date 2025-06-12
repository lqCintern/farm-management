class ActivityLog < ApplicationRecord
  belongs_to :user
  belongs_to :target, polymorphic: true, optional: true
end
