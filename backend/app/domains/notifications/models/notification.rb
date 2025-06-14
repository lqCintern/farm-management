module Notifications
  module Models
    class Notification < ApplicationRecord
      self.table_name = "notifications"

      belongs_to :recipient, class_name: "User"
      belongs_to :sender, class_name: "User", optional: true
      belongs_to :notifiable, polymorphic: true, optional: true

      # Enums
      enum :priority, { low: 0, normal: 1, high: 2 }

      # Validations
      validates :category, :event_type, :title, :message, presence: true
      validates :category, inclusion: { in: %w[farm labor marketplace supply system] }

      # Scopes
      scope :unread, -> { where(read_at: nil) }
      scope :read, -> { where.not(read_at: nil) }
      scope :recent, -> { order(created_at: :desc) }
      scope :by_category, ->(category) { where(category: category) if category.present? }
      scope :by_event_type, ->(event_type) { where(event_type: event_type) if event_type.present? }
      scope :for_recipient, ->(user_id) { where(recipient_id: user_id) }

      # Methods
      def read?
        read_at.present?
      end

      def mark_as_read!
        update(read_at: Time.current) unless read?
      end

      def mark_as_unread!
        update(read_at: nil) if read?
      end

      def delivered_via_email?
        sent_via_email_at.present?
      end

      def delivered_via_push?
        sent_via_push_at.present?
      end

      # Method to help with frontend display
      def display_data
        {
          id: id,
          title: title,
          message: message,
          category: category,
          event_type: event_type,
          priority: priority,
          created_at: created_at,
          read: read?,
          sender_name: sender&.user_name || "Hệ thống",
          action_url: generate_action_url,
          icon: determine_icon
        }
      end

      private

      def generate_action_url
        case category
        when "farm"
          case event_type
          when "activity_reminder", "activity_updated", "activity_overdue"
            "/farm-activities/#{notifiable_id}" if notifiable_type == "FarmActivity"
          when "harvest_ready"
            "/harvests/#{notifiable_id}" if notifiable_type == "Harvest"
          else
            "/calendar"
          end
        when "labor"
          case event_type
          when "new_request", "request_updated"
            "/labor/requests/#{notifiable_id}" if notifiable_type == "Labor::LaborRequest"
          when "assignment_created"
            "/labor/assignments/#{notifiable_id}" if notifiable_type == "Labor::LaborAssignment"
          else
            "/labor"
          end
        when "marketplace"
          case event_type
          when "new_order"
            "/orders/#{notifiable_id}" if notifiable_type == "ProductOrder"
          when "new_message"
            "/chat/#{metadata['conversation_id']}" if metadata.present? && metadata["conversation_id"].present?
          else
            "/products"
          end
        when "supply"
          case event_type
          when "new_supply_order"
            "/supply-orders/#{notifiable_id}" if notifiable_type == "SupplyOrder"
          else
            "/supply-marketplace"
          end
        else
          "/"
        end
      end

      def determine_icon
        case category
        when "farm"
          case event_type
          when "activity_reminder" then "🌱"
          when "activity_updated" then "📝"
          when "activity_overdue" then "⚠️"
          when "harvest_ready" then "🍍"
          else "🚜"
          end
        when "labor"
          case event_type
          when "new_request" then "🤝"
          when "request_updated" then "📋"
          when "assignment_created" then "👥"
          else "👨‍🌾"
          end
        when "marketplace"
          case event_type
          when "new_order" then "🛒"
          when "new_message" then "💬"
          else "🏪"
          end
        when "supply"
          case event_type
          when "new_supply_order" then "📦"
          when "supply_order_updated" then "🚚"
          else "🧰"
          end
        else
          "📢"
        end
      end
    end
  end
end
