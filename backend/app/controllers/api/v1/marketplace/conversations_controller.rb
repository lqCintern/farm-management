# app/controllers/api/v1/conversations_controller.rb
module Api
  module V1
    module Marketplace
      class ConversationsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!
        before_action :set_conversation, only: [ :show, :messages, :add_message ]

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
                    include: { product_images: { methods: [ :image_url ], limit: 1 } },
                    only: [ :id, :title, :status ]
                  },
                  sender: { only: [ :user_id, :user_name, :fullname ] },
                  receiver: { only: [ :user_id, :user_name, :fullname ] }
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
                  user: { only: [ :user_id, :user_name, :fullname ] },
                  product_images: { methods: [ :image_url ], limit: 1 }
                },
                only: [ :id, :title, :status, :product_type, :quantity, :price_expectation ]
              },
              sender: { only: [ :user_id, :user_name, :fullname ] },
              receiver: { only: [ :user_id, :user_name, :fullname ] }
            }, methods: [ :unread_count_for_current_user ])
          }, status: :ok
        end

        # GET /api/v1/conversations/:id/messages
        def messages
          messages = FirebaseMessageService.get_messages(@conversation.id, params[:limit] || 20)

          FirebaseMessageService.mark_all_as_read(@conversation.id, current_user.user_id)

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

          # Thêm tin nhắn đầu tiên bằng FirebaseMessageService
          if params[:message].present?
            Rails.logger.info "Saving first message to conversation #{conversation.id} using FirebaseMessageService"

            message_id = FirebaseMessageService.save_message(conversation.id, {
              user_id: current_user.user_id,
              content: params[:message],
              type: "text"
            })

            if message_id.nil?
              Rails.logger.error "Failed to save first message to Firebase"
              return render json: { error: "Không thể lưu tin nhắn" }, status: :unprocessable_entity
            else
              Rails.logger.info "Successfully saved first message with ID: #{message_id}"
            end
          end

          render json: {
            message: "Đã tạo hội thoại thành công",
            conversation_id: conversation.id
          }, status: :created
        end

        # POST /api/v1/conversations/:id/messages
        def add_message
          # Kiểm tra quyền truy cập
          unless @conversation.sender_id == current_user.user_id || @conversation.receiver_id == current_user.user_id
            return render json: { error: "Không có quyền truy cập cuộc trò chuyện này" }, status: :forbidden
          end

          # Kiểm tra nội dung tin nhắn
          if params[:message].blank? && params[:image].blank? && !params[:payment_info].present?
            return render json: { error: "Tin nhắn không được để trống" }, status: :bad_request
          end

          # Chuẩn bị dữ liệu tin nhắn
          message_data = {
            user_id: current_user.user_id,
            content: params[:message] || "",
            created_at: Time.now.to_i * 1000, # Milliseconds
            type: params[:type] || "text"
          }

          # Xử lý hình ảnh nếu có
          if params[:image].present?
            message_data[:image] = params[:image]
            message_data[:type] = "image" if message_data[:type] == "text"

            Rails.logger.info "Processing image upload for message in conversation #{@conversation.id}"
          end

          # Xử lý thông tin thanh toán nếu có
          if params[:payment_info].present?
            message_data[:payment_info] = params[:payment_info]
            message_data[:type] = "payment"

            Rails.logger.info "Processing payment info for message in conversation #{@conversation.id}"
          end

          # Xử lý thông tin lịch trình thu hoạch
          if params[:harvest_info].present?
            message_data[:metadata] = { harvest_info: params[:harvest_info] }
            message_data[:type] = "schedule"

            Rails.logger.info "Processing harvest schedule info for message in conversation #{@conversation.id}"
          end

          # Lưu tin nhắn với FirebaseMessageService
          Rails.logger.info "Adding #{message_data[:type]} message to conversation #{@conversation.id}"

          message_id = FirebaseMessageService.save_message(@conversation.id, message_data)

          if message_id
            # Cập nhật thời gian của conversation
            @conversation.touch

            Rails.logger.info "Successfully added message with ID: #{message_id}"
            render json: {
              message_id: message_id,
              message_type: message_data[:type]
            }, status: :created
          else
            Rails.logger.error "Failed to save message to Firebase"
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
end
