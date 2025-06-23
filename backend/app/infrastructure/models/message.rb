module Models
class Message < Models::ApplicationRecord
  belongs_to :conversation
  belongs_to :user, primary_key: "user_id"

  validates :content, presence: true

  # Scope
  scope :unread_for, ->(user_id) {
    where.not(user_id: user_id).where(read: false)
  }

  # Methods
  def mark_as_read!
    update(read: true) unless read?
  end
end
end
