# app/controllers/api/v1/product_orders_controller.rb
module Api
  module V1
    module Marketplace
      class ProductOrdersController < BaseController
        include Pagy::Backend
        
        before_action :authenticate_user!
        before_action :set_product_order, only: [:show, :update]
        before_action :authorize_order_action, only: [:update]
        
        # GET /api/v1/product_orders
        def index
          if current_user.farmer?
            orders = ProductOrder.for_seller(current_user.user_id)
          else
            orders = current_user.product_orders
          end
          
          # Filter by status
          if params[:status].present?
            orders = orders.where(status: params[:status])
          end
          
          @pagy, orders = pagy(orders.includes(:product_listing).order(created_at: :desc), items: params[:per_page] || 10)
          
          render json: {
            orders: orders.as_json(include: {
              product_listing: {
                include: { product_images: { methods: [:image_url], limit: 1 } },
                only: [:id, :title, :product_type, :quantity, :price_expectation]
              },
              buyer: { only: [:user_id, :user_name, :fullname, :phone] }
            }),
            pagination: {
              count: @pagy.count,
              page: @pagy.page,
              pages: @pagy.pages,
              last: @pagy.last,
              next: @pagy.next,
              prev: @pagy.prev
            },
            statistics: order_statistics
          }, status: :ok
        end
        
        # GET /api/v1/product_orders/:id
        def show
          render json: {
            order: @product_order.as_json(include: {
              product_listing: {
                include: { 
                  user: { only: [:user_id, :user_name, :fullname, :phone] },
                  product_images: { methods: [:image_url] }
                }
              },
              buyer: { only: [:user_id, :user_name, :fullname, :phone] }
            })
          }, status: :ok
        end
        
        # POST /api/v1/product_orders
        def create
          unless current_user.trader?
            return render json: { error: "Chỉ thương lái mới có thể đặt mua sản phẩm" }, status: :forbidden
          end
          
          # Tìm sản phẩm
          product_listing = ProductListing.find_by(id: params[:product_order][:product_listing_id])
          
          if product_listing.nil?
            return render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found
          end
          
          # Kiểm tra đã đặt hàng chưa
          if ProductOrder.exists?(product_listing: product_listing, buyer: current_user)
            return render json: { error: "Bạn đã đặt mua sản phẩm này rồi" }, status: :unprocessable_entity
          end
          
          # Tạo đơn hàng
          product_order = ProductOrder.new(product_order_params)
          product_order.buyer = current_user
          
          if product_order.save
            conversation = Conversation.find_or_create_by(
              product_listing: product_listing,
              sender: current_user,
              receiver: product_listing.user
            )
            
            # Thêm tin nhắn thông báo
            message_content = "Tôi đã đặt mua #{product_order.quantity} #{product_listing.product_type}."
            message_content += " Giá đề xuất: #{product_order.price}/kg" if product_order.price.present?
            message_content += " Ghi chú: #{product_order.note}" if product_order.note.present?
            
            conversation.messages.create(
              user: current_user,
              content: message_content
            )
            
            # Gửi thông báo
            product_order.create_notification
            
            render json: {
              message: "Đã gửi yêu cầu đặt mua thành công",
              order: product_order.as_json(include: {
                product_listing: { only: [:id, :title] }
              }),
              conversation_id: conversation.id
            }, status: :created
          else
            render json: { errors: product_order.errors.full_messages }, status: :unprocessable_entity
          end
        end
        
        # PUT/PATCH /api/v1/product_orders/:id
        def update
          # Cập nhật trạng thái
          if params[:status].present?
            begin
              case params[:status]
              when "accept"
                # Chỉ người bán mới được accept
                unless @product_order.product_listing.user_id == current_user.user_id
                  return render json: { error: "Chỉ người bán mới được chấp nhận đơn hàng" }, status: :forbidden
                end
                
                @product_order.update( status: :accepted )
                  
                # Tìm và thông báo qua tin nhắn
                send_order_notification(@product_order, "Tôi đã chấp nhận đơn đặt hàng của bạn!")
                
              when "reject"
                # Chỉ người bán mới được reject
                unless @product_order.product_listing.user_id == current_user.user_id
                  return render json: { error: "Chỉ người bán mới được từ chối đơn hàng" }, status: :forbidden
                end
                
                @product_order.update(
                  status: :rejected,
                  rejection_reason: params[:reason]
                )
                
                message = "Đã từ chối đơn đặt hàng"
                
                # Tìm và thông báo qua tin nhắn
                reason_text = params[:reason].present? ? "vì: #{params[:reason]}" : "vì không đáp ứng được yêu cầu"
                send_order_notification(@product_order, "Tôi không thể chấp nhận đơn hàng này #{reason_text}")
                
              when "complete"
                # Cả người mua và người bán đều có thể đánh dấu hoàn thành
                if @product_order.product_listing.user_id != current_user.user_id && 
                  @product_order.buyer_id != current_user.user_id
                  return render json: { error: "Bạn không có quyền với đơn hàng này" }, status: :forbidden
                end
                
                # Chỉ khi đã accepted thì mới được complete
                unless @product_order.accepted?
                  return render json: { error: "Đơn hàng cần được chấp nhận trước khi hoàn thành" }, status: :unprocessable_entity
                end
                
                @product_order.completed!
                message = "Đã hoàn thành đơn hàng"
                
                # Thông báo qua tin nhắn
                notification = current_user.user_id == @product_order.buyer_id ?
                  "Tôi đã nhận được sản phẩm, cảm ơn bạn!" :
                  "Giao dịch đã hoàn tất, cảm ơn bạn!"
                
                send_order_notification(@product_order, notification)
                
                # Ghi nhận doanh thu
                create_sale_transaction(@product_order)
                
              else
                return render json: { error: "Trạng thái không hợp lệ" }, status: :bad_request
              end
              
              render json: { 
                message: message, 
                status: @product_order.status,
                order: @product_order.as_json(include: {
                  product_listing: { only: [:id, :title, :status] }
                })
              }, status: :ok
            rescue => e
              render json: { error: e.message }, status: :unprocessable_entity
            end
          else
            # Các cập nhật khác
            if @product_order.update(product_order_update_params)
              render json: {
                message: "Đã cập nhật đơn hàng",
                order: @product_order
              }, status: :ok
            else
              render json: { errors: @product_order.errors.full_messages }, status: :unprocessable_entity
            end
          end
        end
        
        private
        
        def set_product_order
          @product_order = ProductOrder.find_by(id: params[:id])
          render json: { error: "Không tìm thấy đơn hàng" }, status: :not_found unless @product_order
        end
        
        def authorize_order_action
          # Kiểm tra là người mua hoặc người bán
          order_owner = @product_order.product_listing.user_id == current_user.user_id || 
                        @product_order.buyer_id == current_user.user_id
                        
          render json: { error: "Không có quyền thực hiện hành động này" }, status: :forbidden unless order_owner
        end
        
        def product_order_params
          params.require(:product_order).permit(
            :product_listing_id, :quantity, :price, :note
          )
        end
        
        def product_order_update_params
          # Các trường có thể cập nhật khi không thay đổi status
          params.require(:product_order).permit(:quantity, :price, :note)
        end
        
        def order_statistics
          if current_user.farmer?
            base_orders = ProductOrder.for_seller(current_user.user_id)
            {
              pending: base_orders.pending_orders.count,
              accepted: base_orders.accepted_orders.count,
              completed: base_orders.completed_orders.count,
              rejected: base_orders.rejected_orders.count,
              total: base_orders.count
            }
          else
            base_orders = current_user.product_orders
            {
              pending: base_orders.pending_orders.count,
              accepted: base_orders.accepted_orders.count,
              completed: base_orders.completed_orders.count,
              rejected: base_orders.rejected_orders.count,
              total: base_orders.count
            }
          end
        end
        
        def send_order_notification(order, message)
          # Tìm conversation
          conversation = Conversation.find_by(
            product_listing_id: order.product_listing_id,
            sender_id: order.buyer_id,
            receiver_id: order.product_listing.user_id
          ) || Conversation.find_by(
            product_listing_id: order.product_listing_id,
            sender_id: order.product_listing.user_id,
            receiver_id: order.buyer_id
          )
          
          # Gửi tin nhắn nếu tìm thấy conversation
          if conversation
            conversation.messages.create(
              user: current_user,
              content: message
            )
          end
        end
        
        def create_sale_transaction(order)
          # Ghi nhận giao dịch khi hoàn thành đơn hàng (nếu có bảng transactions)
          return unless defined?(Transaction)
          
          total_amount = order.price * order.quantity
          
          # Ghi nhận doanh thu cho người bán
          Transaction.create(
            user_id: order.product_listing.user_id,
            type: 1, # Giả sử 1 là loại income/doanh thu
            amount: total_amount,
            description: "Bán #{order.quantity} #{order.product_listing.product_type} cho #{order.buyer&.fullname || 'Thương lái'}",
            date: Time.current
          )
        end
      end
    end
  end
end
