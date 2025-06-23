module UseCases::Notification
  class CreateNotification
    def initialize(repository)
      @repository = repository
    end

    def execute(attributes)
      # Convert notifiable to type and id if provided as object
      if attributes[:notifiable].present?
        notifiable = attributes[:notifiable]
        attributes[:notifiable_type] = notifiable.class.name
        attributes[:notifiable_id] = notifiable.id
        attributes.delete(:notifiable)
      end

      # Create entity
      notification_entity = Entities::Notification::Notification.new(attributes)

      # Save via repository
      result = @repository.create(notification_entity)

      if result
        { success: true, notification: result }
      else
        { success: false, error: "Failed to create notification" }
      end
    end
  end
end
