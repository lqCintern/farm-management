
  class NotificationSetting < ApplicationRecord
    belongs_to :user

    # Validations
    validates :category, presence: true
    validates :category, inclusion: { in: %w[farm labor marketplace supply system all] }
    validates :user_id, uniqueness: { scope: [ :category, :event_type ],
                                      message: "đã có cài đặt này" }

    # Scope
    scope :for_user, ->(user_id) { where(user_id: user_id) }
    scope :by_category, ->(category) { where(category: category) }
    scope :for_event_type, ->(event_type) {
      where("event_type = ? OR event_type IS NULL", event_type) if event_type.present?
    }

    # Các phương thức hỗ trợ
    def self.user_enabled_channel?(user_id, category, event_type, channel)
      # Kiểm tra cài đặt cụ thể cho loại sự kiện
      setting = find_by(user_id: user_id, category: category, event_type: event_type)
      return setting.public_send("#{channel}_enabled") if setting

      # Kiểm tra cài đặt tổng thể cho danh mục
      setting = find_by(user_id: user_id, category: category, event_type: nil)
      return setting.public_send("#{channel}_enabled") if setting

      # Kiểm tra cài đặt mặc định
      setting = find_by(user_id: user_id, category: "all", event_type: nil)
      setting ? setting.public_send("#{channel}_enabled") : true
    end
  end
