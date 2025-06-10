module Entities
  module Notification
    class Notification
      attr_reader :id, :recipient_id, :sender_id, :read_at, :created_at, :updated_at,
                  :notifiable_type, :notifiable_id, :category, :event_type,
                  :title, :message, :metadata, :priority

      def initialize(attributes = {})
        @id = attributes[:id]
        @recipient_id = attributes[:recipient_id]
        @sender_id = attributes[:sender_id]
        @read_at = attributes[:read_at]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @notifiable_type = attributes[:notifiable_type]
        @notifiable_id = attributes[:notifiable_id]
        @category = attributes[:category]
        @event_type = attributes[:event_type]
        @title = attributes[:title]
        @message = attributes[:message]
        @metadata = attributes[:metadata] || {}
        @priority = attributes[:priority] || 3
      end

      # Domain logic
      def read?
        !@read_at.nil?
      end

      def unread?
        @read_at.nil?
      end

      def display_data
        {
          id: @id,
          title: @title,
          message: @message,
          read: read?,
          created_at: @created_at,
          updated_at: @updated_at,
          category: @category,
          event_type: @event_type,
          metadata: @metadata,
          sender_id: @sender_id,
          recipient_id: @recipient_id
        }
      end

      def time_ago
        return nil unless @created_at

        seconds = (Time.current - @created_at).to_i

        case seconds
        when 0..59
          "vừa xong"
        when 60..3599
          "#{seconds / 60} phút trước"
        when 3600..86399
          "#{seconds / 3600} giờ trước"
        when 86400..604799
          "#{seconds / 86400} ngày trước"
        when 604800..2419199
          "#{seconds / 604800} tuần trước"
        when 2419200..29030399
          "#{seconds / 2419200} tháng trước"
        else
          "#{seconds / 29030400} năm trước"
        end
      end
    end
  end
end
