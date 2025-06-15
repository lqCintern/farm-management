# app/controllers/api/v1/conversations_controller.rb
module Api
  module V1
    module Marketplace
      class ConversationsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!
        before_action :set_conversation, only: [:show, :messages, :add_message]

        # GET /api/v1/marketplace/conversations
        def index
          conversations = Conversation.for_user(current_user.user_id)
                                    .includes(:sender, :receiver, :product_listing)
                                    .order(updated_at: :desc)

          render json: {
            conversations: conversations.map do |conversation|
              {
                id: conversation.id,
                product_listing: conversation.product_listing&.as_json(
                  include: { 
                    product_images: { 
                      methods: [:image_url], 
                      limit: 1 
                    } 
                  },
                  only: [:id, :title, :status, :user_id]
                ),
                sender: {
                  user_id: conversation.sender.user_id,
                  user_name: conversation.sender.user_name,
                  fullname: conversation.sender.fullname
                },
                receiver: {
                  user_id: conversation.receiver.user_id,
                  user_name: conversation.receiver.user_name,
                  fullname: conversation.receiver.fullname
                },
                # Sử dụng phương thức có tham số để tránh lỗi
                unread_count: conversation.unread_count(current_user.user_id),
                last_message: conversation.last_message&.as_json(
                  only: [:content, :created_at]
                )
              }
            end
          }, status: :ok
        end

        # GET /api/v1/marketplace/conversations/:id
        def show
          render json: {
            conversation: @conversation.as_json(
              include: {
                product_listing: {
                  include: { 
                    product_images: { methods: [:image_url] } 
                  },
                  only: [:id, :title, :status, :user_id, :price, :quantity]
                },
                sender: { only: [:user_id, :user_name, :fullname] },
                receiver: { only: [:user_id, :user_name, :fullname] }
              }
            ).merge(
              unread_count: @conversation.unread_count(current_user.user_id)
            )
          }, status: :ok
        end

        # GET /api/v1/marketplace/conversations/:id/messages
        def messages
          messages = @conversation.messages.includes(:user)
                                          .order(created_at: :asc)

          render json: {
            messages: messages.map do |message|
              {
                id: message.id,
                content: message.content,
                user_id: message.user_id,
                created_at: message.created_at,
                read: message.read,
                read_at: message.read_at,
                type: message.message_type,
                image_url: message.image_url,
                payment_info: message.payment_info,
                metadata: message.metadata,
                user_name: message.user&.user_name
              }
            end
          }, status: :ok
        end

        # POST /api/v1/marketplace/conversations/:id/messages
        def add_message
          message = @conversation.messages.build(message_params)
          message.user_id = current_user.user_id

          if message.save
            # Cập nhật thời gian conversation
            @conversation.touch

            # Broadcast message qua WebSocket nếu có
            # broadcast_message(message)

            render json: {
              message: message.as_json(
                include: { user: { only: [:user_id, :user_name, :fullname] } }
              )
            }, status: :created
          else
            render json: {
              errors: message.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        private

        def set_conversation
          @conversation = Conversation.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Conversation not found" }, status: :not_found
        end

        def message_params
          params.require(:message).permit(:content, :type, :image_url, :payment_info, :metadata)
        end
      end
    end
  end
end
