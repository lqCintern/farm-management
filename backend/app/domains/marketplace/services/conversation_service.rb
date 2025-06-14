module Marketplace
  class ConversationService
    def find_conversation(product_listing_id, trader_id)
      product_listing = ProductListing.find_by(id: product_listing_id)
      return nil unless product_listing

      farmer_id = product_listing.user_id

      Conversation.find_by(
        product_listing_id: product_listing_id,
        sender_id: trader_id,
        receiver_id: farmer_id
      ) || Conversation.find_by(
        product_listing_id: product_listing_id,
        sender_id: farmer_id,
        receiver_id: trader_id
      )
    end

    def send_message(conversation_id, user_id, content, type = "text", additional_data = {})
      FirebaseMessageService.save_message(conversation_id, {
        user_id: user_id,
        content: content,
        type: type,
        **additional_data
      })
    end

    def send_order_notification(order, user, message)
      # Tìm conversation
      conversation = find_conversation(order.product_listing_id, order.buyer_id)

      # Gửi tin nhắn nếu tìm thấy conversation
      if conversation
        conversation.messages.create(
          user: user,
          content: message
        )
      end
    end

    def send_schedule_notification(harvest, user, message, type = "schedule")
      conversation = find_conversation(harvest.product_listing_id, harvest.trader_id)
      if conversation
        send_message(conversation.id, user.user_id, message, type)
      end
    end
  end
end
