module Repositories
  module Notification
    class NotificationRepository
      def find(id)
        record = ::Models::Notifications::Notification.find_by(id: id)
        map_to_entity(record) if record
      end

      def list_for_user(user_id, category = nil, status = nil, page = 1, per_page = 20)
        query = ::Models::Notifications::Notification.where(recipient_id: user_id).order(created_at: :desc)

        # Apply filters
        query = query.where(category: category) if category.present?

        if status == "read"
          query = query.where.not(read_at: nil)
        elsif status == "unread"
          query = query.where(read_at: nil)
        end

        # Paginate
        pagy = Pagy.new(count: query.count, page: page, items: per_page)
        # Sửa phương thức items thành limit ở đây
        records = query.offset(pagy.offset).limit(pagy.limit)

        [ pagy, records.map { |record| map_to_entity(record) } ]
      end

      def mark_as_read(id)
        record = ::Models::Notifications::Notification.find_by(id: id)
        return nil unless record

        record.update(read_at: Time.current)
        map_to_entity(record)
      end

      def mark_as_unread(id)
        record = ::Models::Notifications::Notification.find_by(id: id)
        return nil unless record

        record.update(read_at: nil)
        map_to_entity(record)
      end

      def mark_all_as_read(user_id, category = nil)
        scope = ::Models::Notifications::Notification.where(recipient_id: user_id, read_at: nil)
        scope = scope.where(category: category) if category.present?

        count = scope.count
        scope.update_all(read_at: Time.current)

        count
      end

      def delete(id)
        record = ::Models::Notifications::Notification.find_by(id: id)
        record.destroy if record
        record&.destroyed? || false
      end

      def count_unread(user_id, category = nil)
        query = ::Models::Notifications::Notification.where(recipient_id: user_id, read_at: nil)

        if category.present?
          query = query.where(category: category)
          query.count
        else
          # Count by categories
          {
            total: query.count,
            marketplace: query.where(category: "marketplace").count,
            farm: query.where(category: "farm").count,
            labor: query.where(category: "labor").count,
            supply: query.where(category: "supply").count
          }
        end
      end

      def create(entity)
        record = ::Models::Notifications::Notification.new(
          recipient_id: entity.recipient_id,
          sender_id: entity.sender_id,
          notifiable_type: entity.notifiable_type,
          notifiable_id: entity.notifiable_id,
          read_at: entity.read_at,
          category: entity.category,
          event_type: entity.event_type,
          title: entity.title,
          message: entity.message,
          metadata: entity.metadata,
          priority: entity.priority || 2
        )

        if record.save
          map_to_entity(record)
        else
          nil
        end
      end

      private

      def map_to_entity(record)
        return nil unless record

        Entities::Notification::Notification.new(
          id: record.id,
          recipient_id: record.recipient_id,
          sender_id: record.sender_id,
          read_at: record.read_at,
          created_at: record.created_at,
          updated_at: record.updated_at,
          notifiable_type: record.notifiable_type,
          notifiable_id: record.notifiable_id,
          category: record.category,
          event_type: record.event_type,
          title: record.title,
          message: record.message,
          metadata: record.metadata,
          priority: record.priority
        )
      end
    end
  end
end
