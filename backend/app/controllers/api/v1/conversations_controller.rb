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
                                    .includes(:sender, :receiver, :product_listing, :messages)
                                    .order('messages.created_at DESC')
        
        render json: {
          conversations: conversations.as_json(include: {
            product_listing: {
              include: { product_images: { methods: [:image_url], limit: 1 } },
              only: [:id, :title, :status]
            },
            sender: { only: [:user_id, :user_name, :fullname] },
            receiver: { only: [:user_id, :user_name, :fullname] },
            messages: { order: 'created_at DESC', limit: 1 }
          }, methods: [:unread_count]),
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
          }, methods: [:unread_count])
        }, status: :ok
      end
      
      # GET /api/v1/conversations/:id/messages
      def messages
        # Lấy tin nhắn và đánh dấu đã đọc
        @pagy, messages = pagy(
          @conversation.messages.includes(:user).order(created_at: :desc),
          items: params[:per_page] || 20
        )
        
        # Đánh dấu đã đọc các tin nhắn không phải của mình
        @conversation.messages.unread_for(current_user.user_id).update_all(read: true)
        
        render json: {
          messages: messages.reverse.as_json(include: {
            user: { only: [:user_id, :user_name, :fullname] }
          }),
          pagination: pagy_metadata(@pagy),
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
          message = conversation.messages.create(
            user: current_user,
            content: params[:message]
          )
          
          # Tăng số lượng tin nhắn trong bài đăng
          product_listing.increment_message_count!
        end
        
        render json: {
          message: "Đã tạo hội thoại thành công",
          conversation_id: conversation.id,
          first_message: message
        }, status: :created
      end
      
      # POST /api/v1/conversations/:id/messages
      def add_message
        return render json: { error: "Nội dung tin nhắn không được để trống" }, status: :bad_request if params[:message].blank?
        
        message = @conversation.messages.new(
          user: current_user,
          content: params[:message]
        )
        
        if message.save
          # Tăng số lượng tin nhắn trong bài đăng
          @conversation.product_listing.increment_message_count! if @conversation.product_listing.present?
          
          # Render lại conversation với tin nhắn mới
          render json: { 
            message: message.as_json(include: {
              user: { only: [:user_id, :user_name, :fullname] }
            })
          }, status: :created
        else
          render json: { errors: message.errors.full_messages }, status: :unprocessable_entity
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
