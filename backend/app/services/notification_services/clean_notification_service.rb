module NotificationServices
  class CleanNotificationService
    def initialize(create_notification_use_case)
      @create_notification_use_case = create_notification_use_case
    end

    # General create notification method
    def create_notification(attributes)
      @create_notification_use_case.execute(attributes)
    end

    #--------------------------------------------------
    # MARKETPLACE NOTIFICATIONS
    #--------------------------------------------------

    # Thông báo đơn hàng mới
    def new_order(order)
      return unless order && order.respond_to?(:id) && order.respond_to?(:product_listing)
      return unless order.product_listing&.user_id

      create_notification(
        recipient_id: order.product_listing.user_id,
        sender_id: order.buyer_id,
        notifiable_type: "Marketplace::ProductOrder",
        notifiable_id: order.id,
        category: "marketplace",
        event_type: "new_order",
        title: "Đơn hàng mới",
        message: "Bạn có đơn hàng mới cho sản phẩm #{order.product_listing.title}",
        metadata: {
          order_id: order.id,
          product_id: order.product_listing_id,
          product_name: order.product_listing.title,
          quantity: order.quantity,
          price: order.price,
          buyer_id: order.buyer_id,
          buyer_name: order.buyer.present? ? order.buyer[:user_name] : nil
        }
      )
    end

    # Thông báo cập nhật trạng thái đơn hàng
    # Đảm bảo phương thức này chấp nhận entity order thay vì order_id
    def order_status_updated(order, old_status)
      return unless order && order.respond_to?(:id)

      status_text = case order.status.to_s
      when "accepted" then "đã được chấp nhận"
      when "rejected" then "đã bị từ chối"
      when "completed" then "đã hoàn thành"
      else "đã được cập nhật"
      end

      create_notification(
        recipient_id: order.buyer_id,
        sender_id: order.product_listing.user_id,
        notifiable_type: "Marketplace::ProductOrder",
        notifiable_id: order.id,
        category: "marketplace",
        event_type: "order_updated",
        title: "Đơn hàng được cập nhật",
        message: "Đơn hàng của bạn đã #{status_text}",
        metadata: {
          order_id: order.id,
          product_id: order.product_listing_id,
          product_name: order.product_listing.title,
          old_status: old_status,
          new_status: order.status
        }
      )
    end

    # Thông báo tin nhắn mới
    def new_message(message)
      return unless message && message.respond_to?(:id)
      conversation = message.respond_to?(:conversation) ? message.conversation : nil
      return unless conversation

      recipient_id = message.user_id == conversation.sender_id ?
        conversation.receiver_id : conversation.sender_id

      create_notification(
        recipient_id: recipient_id,
        sender_id: message.user_id,
        notifiable_type: "Message",
        notifiable_id: message.id,
        category: "marketplace",
        event_type: "new_message",
        title: "Tin nhắn mới",
        message: "Bạn có tin nhắn mới",
        metadata: {
          message_id: message.id,
          conversation_id: conversation.id,
          message_content: message.content.to_s.truncate(50),
          product_id: conversation.product_listing_id
        }
      )
    end

    # Thông báo thu hoạch
    def new_harvest(harvest)
      return unless harvest

      create_notification(
        recipient_id: harvest.product_listing.user_id,
        sender_id: harvest.trader_id,
        notifiable_type: "Marketplace::MarketplaceHarvest",
        notifiable_id: harvest.id,
        category: "marketplace",
        event_type: "new_harvest",
        title: "Lịch thu hoạch mới",
        message: "Bạn có lịch thu hoạch mới cho sản phẩm #{harvest.product_listing.title}",
        metadata: {
          harvest_id: harvest.id,
          product_id: harvest.product_listing_id,
          scheduled_date: harvest.scheduled_date,
          trader_id: harvest.trader_id
        }
      )
    end

    #--------------------------------------------------
    # FARM NOTIFICATIONS
    #--------------------------------------------------

    # Thông báo nhắc nhở hoạt động sắp tới
    def activity_reminder(activity, days_before = 1)
      return unless activity

      # Người nhận là chủ nông trại và những người được phân công
      recipients = [ activity.user_id ]

      if activity.respond_to?(:assignments) && activity.assignments.any?
        recipients += activity.assignments.map { |a| a[:worker_id] }.compact
      end

      recipients.uniq.compact.each do |recipient_id|
        create_notification(
          recipient_id: recipient_id,
          sender_id: nil, # System notification
          notifiable_type: activity.class.name,
          notifiable_id: activity.id,
          category: "farm",
          event_type: "activity_reminder",
          title: "Nhắc nhở: #{activity.description}",
          message: "Hoạt động #{activity.description} sẽ diễn ra vào ngày #{activity.start_date.strftime('%d/%m/%Y')}",
          metadata: {
            days_before: days_before,
            activity_id: activity.id,
            field_id: activity.field_id,
            field_name: activity.field&.name || "N/A",
            start_date: activity.start_date
          }
        )
      end
    end

    # Thông báo khi hoạt động quá hạn
    def activity_overdue(activity)
      return unless activity && activity.status != "completed" && activity.end_date

      days_overdue = (Date.today - activity.end_date.to_date).to_i
      return unless days_overdue > 0

      create_notification(
        recipient_id: activity.user_id,
        sender_id: nil,
        notifiable_type: activity.class.name,
        notifiable_id: activity.id,
        category: "farm",
        event_type: "activity_overdue",
        title: "Quá hạn: #{activity.description}",
        message: "Hoạt động #{activity.description} đã quá hạn #{days_overdue} ngày",
        metadata: {
          activity_id: activity.id,
          field_id: activity.field_id,
          field_name: activity.field&.name || "N/A",
          days_overdue: days_overdue
        },
        priority: 2 # High priority
      )
    end

    # Thông báo mùa vụ chuyển giai đoạn
    def crop_stage_changed(crop, old_stage, new_stage)
      return unless crop

      create_notification(
        recipient_id: crop.user_id,
        sender_id: nil,
        notifiable_type: crop.class.name,
        notifiable_id: crop.id,
        category: "farm",
        event_type: "crop_stage_changed",
        title: "Mùa vụ đã chuyển giai đoạn",
        message: "Mùa vụ #{crop.name} đã chuyển từ giai đoạn #{old_stage} sang #{new_stage}",
        metadata: {
          crop_id: crop.id,
          field_id: crop.field_id,
          field_name: crop.field&.name || "N/A",
          old_stage: old_stage,
          new_stage: new_stage
        }
      )
    end

    # Thông báo thu hoạch sẵn sàng
    def harvest_ready(harvest)
      return unless harvest

      create_notification(
        recipient_id: harvest.user_id,
        sender_id: nil,
        notifiable_type: harvest.class.name,
        notifiable_id: harvest.id,
        category: "farm",
        event_type: "harvest_ready",
        title: "Thu hoạch sẵn sàng",
        message: "Thu hoạch #{harvest.crop_name || 'mùa vụ'} đã sẵn sàng tại #{harvest.field&.name || 'cánh đồng'}",
        metadata: {
          harvest_id: harvest.id,
          field_id: harvest.field_id,
          crop_name: harvest.crop_name,
          estimated_quantity: harvest.estimated_quantity
        },
        priority: 2 # High priority
      )
    end

    #--------------------------------------------------
    # LABOR NOTIFICATIONS
    #--------------------------------------------------

    # Thông báo yêu cầu đổi công mới
    def new_labor_request(request)
      return unless request
      return unless request.providing_household_id

      # Xác định người nhận
      recipient_id = request.providing_household&.owner_id
      return unless recipient_id

      create_notification(
        recipient_id: recipient_id,
        sender_id: request.requesting_household&.owner_id,
        notifiable_type: request.class.name,
        notifiable_id: request.id,
        category: "labor",
        event_type: "new_request",
        title: "Yêu cầu đổi công mới",
        message: "#{request.requesting_household&.name} đã gửi yêu cầu đổi công: #{request.title}",
        metadata: {
          request_id: request.id,
          request_title: request.title,
          requesting_household_id: request.requesting_household_id,
          requesting_household_name: request.requesting_household&.name,
          start_date: request.start_date,
          end_date: request.end_date
        }
      )
    end

    # Thông báo phản hồi yêu cầu đổi công
    def labor_request_response(request, status)
      return unless request

      # Người nhận là người tạo yêu cầu
      recipient_id = request.requesting_household&.owner_id
      sender_id = request.providing_household&.owner_id

      title = case status
      when "accepted" then "Yêu cầu đổi công được chấp nhận"
      when "rejected" then "Yêu cầu đổi công bị từ chối"
      else "Cập nhật yêu cầu đổi công"
      end

      message = case status
      when "accepted"
                  "#{request.providing_household&.name} đã chấp nhận yêu cầu đổi công: #{request.title}"
      when "rejected"
                  "#{request.providing_household&.name} đã từ chối yêu cầu đổi công: #{request.title}"
      else
                  "Có cập nhật về yêu cầu đổi công: #{request.title}"
      end

      create_notification(
        recipient_id: recipient_id,
        sender_id: sender_id,
        notifiable_type: request.class.name,
        notifiable_id: request.id,
        category: "labor",
        event_type: "request_updated",
        title: title,
        message: message,
        metadata: {
          request_id: request.id,
          request_title: request.title,
          status: status,
          providing_household_id: request.providing_household_id,
          providing_household_name: request.providing_household&.name
        },
        priority: status == "accepted" ? 1 : 2 # Từ chối là ưu tiên cao hơn
      )
    end

    # Thông báo phân công lao động mới
    def new_assignment(assignment)
      return unless assignment

      # Thông báo cho người lao động
      worker_user_id = assignment.worker_id
      return unless worker_user_id

      create_notification(
        recipient_id: worker_user_id,
        sender_id: assignment.assigner_id,
        notifiable_type: assignment.class.name,
        notifiable_id: assignment.id,
        category: "labor",
        event_type: "assignment_created",
        title: "Phân công lao động mới",
        message: "Bạn đã được phân công cho hoạt động: #{assignment.labor_request&.title || 'Không tiêu đề'}",
        metadata: {
          assignment_id: assignment.id,
          request_id: assignment.labor_request_id,
          request_title: assignment.labor_request&.title,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          role: assignment.role,
          notes: assignment.notes
        }
      )
    end

    # Nhắc nhở lịch làm việc
    def assignment_reminder(assignment)
      return unless assignment

      worker_user_id = assignment.worker_id
      return unless worker_user_id

      create_notification(
        recipient_id: worker_user_id,
        sender_id: nil,
        notifiable_type: assignment.class.name,
        notifiable_id: assignment.id,
        category: "labor",
        event_type: "assignment_reminder",
        title: "Nhắc nhở lịch làm việc",
        message: "Nhắc nhở: Bạn có lịch làm việc vào ngày mai cho #{assignment.labor_request&.title || 'công việc'}",
        metadata: {
          assignment_id: assignment.id,
          request_id: assignment.labor_request_id,
          request_title: assignment.labor_request&.title,
          start_date: assignment.start_date,
          location: assignment.labor_request&.location
        }
      )
    end

    #--------------------------------------------------
    # SUPPLY NOTIFICATIONS
    #--------------------------------------------------

    # Thông báo đơn đặt hàng vật tư mới
    def new_supply_order(order)
      return unless order

      # Thông báo cho nhà cung cấp
      supplier_id = order.supply_listing&.user_id
      return unless supplier_id

      create_notification(
        recipient_id: supplier_id,
        sender_id: order.user_id,
        notifiable_type: order.class.name,
        notifiable_id: order.id,
        category: "supply",
        event_type: "new_supply_order",
        title: "Đơn hàng vật tư mới",
        message: "Bạn có đơn hàng vật tư mới: #{order.supply_listing&.name}",
        metadata: {
          order_id: order.id,
          supply_id: order.supply_id,
          supply_name: order.supply_listing&.name,
          quantity: order.quantity,
          total_price: order.price * order.quantity,
          buyer_id: order.user_id
        }
      )
    end

    # Thông báo cập nhật đơn vật tư
    def supply_order_updated(order, old_status)
      return unless order

      status_text = case order.status
      when "accepted" then "đã được chấp nhận"
      when "shipped" then "đang được vận chuyển"
      when "completed" then "đã hoàn thành"
      when "cancelled" then "đã bị hủy"
      else "đã được cập nhật"
      end

      create_notification(
        recipient_id: order.user_id,
        sender_id: order.supply_listing&.user_id,
        notifiable_type: order.class.name,
        notifiable_id: order.id,
        category: "supply",
        event_type: "supply_order_updated",
        title: "Cập nhật đơn hàng vật tư",
        message: "Đơn hàng vật tư #{order.id} #{status_text}",
        metadata: {
          order_id: order.id,
          supply_id: order.supply_id,
          supply_name: order.supply_listing&.name,
          old_status: old_status,
          new_status: order.status
        }
      )
    end

    # Nhắc nhở đánh giá nhà cung cấp
    def review_reminder(order)
      return unless order && order.status == "completed"

      # Chỉ gửi nếu chưa có đánh giá
      has_review = order.respond_to?(:supplier_reviews) && order.supplier_reviews.exists?
      return if has_review

      create_notification(
        recipient_id: order.user_id,
        sender_id: nil,
        notifiable_type: order.class.name,
        notifiable_id: order.id,
        category: "supply",
        event_type: "review_reminder",
        title: "Đánh giá nhà cung cấp",
        message: "Bạn đã nhận được hàng. Hãy đánh giá nhà cung cấp cho đơn hàng #{order.supply_listing&.name}",
        metadata: {
          order_id: order.id,
          supply_id: order.supply_id,
          supply_name: order.supply_listing&.name,
          supplier_id: order.supply_listing&.user_id
        }
      )
    end
  end
end
