# app/controllers/api/v1/conversations_controller.rb
module Api
  module V1
    class ConversationsController < ApplicationController
      include Pagy::Backend

      before_action :authenticate_user!
      before_action :set_conversation, only: [:show, :messages, :add_message]

      # GET /api/v1/conversations
      def index
        conversations = Conversation.for_user(current_user.user_id)
                                    .includes(:sender, :receiver, :product_listing)
                                    .order(updated_at: :desc)

        render json: {
          conversations: conversations.map do |conversation|
            conversation.as_json(
              include: {
                product_listing: {
                  include: { product_images: { methods: [:image_url], limit: 1 } },
                  only: [:id, :title, :status]
                },
                sender: { only: [:user_id, :user_name, :fullname] },
                receiver: { only: [:user_id, :user_name, :fullname] }
              }
            ).merge(unread_count: conversation.unread_count(current_user.user_id))
          end,
          unread_count: Message.joins(:conversation)
                              .where(conversations: { id: conversations.pluck(:id) })
                              .unread_for(current_user.user_id)
                              .count
        }, status: :ok
      end

      # GET /api/v1/conversations/:id
      def show
        render json: {
          conversation: @conversation.as_json(include: {
            product_listing: {
              include: {
                user: { only: [:user_id, :user_name, :fullname] },
                product_images: { methods: [:image_url], limit: 1 }
              },
              only: [:id, :title, :status, :product_type, :quantity, :price_expectation]
            },
            sender: { only: [:user_id, :user_name, :fullname] },
            receiver: { only: [:user_id, :user_name, :fullname] }
          }, methods: [:unread_count_for_current_user])
        }, status: :ok
      end

      # GET /api/v1/conversations/:id/messages
      def messages
        # Lấy tin nhắn từ Firestore
        messages = FirebaseService.get_messages(@conversation.id, params[:limit] || 20)

        # Đánh dấu tin nhắn đã đọc
        FirebaseService.mark_messages_as_read(@conversation.id, current_user.user_id)

        render json: {
          messages: messages,
          user_id: current_user.user_id
        }, status: :ok
      end

      # POST /api/v1/conversations
      def create
        # Tìm product_listing và người nhận
        product_listing = ProductListing.find_by(id: params[:product_listing_id])
        other_user = User.find_by(user_id: params[:user_id])

        if product_listing.nil?
          return render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found
        end

        if other_user.nil?
          return render json: { error: "Không tìm thấy người dùng" }, status: :not_found
        end

        # Tạo hoặc tìm conversation
        conversation = Conversation.find_or_initialize_by(
          product_listing: product_listing,
          sender: current_user,
          receiver: other_user
        )

        # Tránh trường hợp bị đảo người gửi/nhận
        if !conversation.persisted?
          existing_conversation = Conversation.find_by(
            product_listing: product_listing,
            sender: other_user,
            receiver: current_user
          )

          if existing_conversation
            conversation = existing_conversation
          end
        end

        # Lưu conversation nếu chưa tồn tại
        if !conversation.persisted? && !conversation.save
          return render json: { errors: conversation.errors.full_messages }, status: :unprocessable_entity
        end

        # Thêm tin nhắn đầu tiên nếu có
        if params[:message].present?
          message_id = FirebaseService.save_message(conversation.id, {
            user_id: current_user.user_id,
            content: params[:message]
          })

          if message_id.nil?
            return render json: { error: "Không thể lưu tin nhắn" }, status: :unprocessable_entity
          end
        end

        render json: {
          message: "Đã tạo hội thoại thành công",
          conversation_id: conversation.id
        }, status: :created
      end

      # POST /api/v1/conversations/:id/messages
      def add_message
        return render json: { error: "Nội dung tin nhắn không được để trống" }, status: :bad_request if params[:message].blank?

        # Lưu tin nhắn vào Firestore
        message_id = FirebaseService.save_message(@conversation.id, {
          user_id: current_user.user_id,
          content: params[:message]
        })

        if message_id
          render json: { message_id: message_id }, status: :created
        else
          render json: { error: "Không thể lưu tin nhắn" }, status: :unprocessable_entity
        end
      end

      private

      def set_conversation
        @conversation = Conversation.find_by(id: params[:id])

        # Kiểm tra quyền truy cập
        if @conversation.nil? || (@conversation.sender_id != current_user.user_id && @conversation.receiver_id != current_user.user_id)
          render json: { error: "Không tìm thấy cuộc hội thoại" }, status: :not_found
        end
      end
    end
  end
end
