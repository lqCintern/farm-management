module Api
  module V1
    module Marketplace
      class MarketplaceHarvestsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!
        before_action :set_marketplace_harvest, only: [ :show, :update, :destroy, :upload_payment_proof ]
        before_action :set_product_listing, only: [ :create ]

        # GET /api/v1/marketplace/harvests
        def index
          if current_user.farmer?
            # Hộ sản xuất xem lịch thu hoạch của mình
            harvests = MarketplaceHarvest.joins(:product_listing)
                                        .where(product_listings: { user_id: current_user.user_id })
          else
            # Thương lái xem lịch thu hoạch đã đặt
            harvests = MarketplaceHarvest.where(trader_id: current_user.user_id)
          end

          # Lọc theo trạng thái nếu có
          harvests = harvests.where(status: params[:status]) if params[:status].present?

          @pagy, harvests = pagy(harvests.includes(:product_listing).order(scheduled_date: :desc))

          render json: {
            harvests: harvests.map { |h| harvest_response(h) },
            pagination: pagy_metadata(@pagy)
          }
        end

        # GET /api/v1/marketplace/harvests/:id
        def show
          render json: {
            harvest: harvest_response(@marketplace_harvest)
          }
        end

        # POST /api/v1/marketplace/harvests
        def create
          # Xác định vai trò và kiểm tra quyền lập lịch
          is_farmer = current_user.farmer?

          # Xác định farmer_id từ product_listing
          farmer_id = @product_listing.user_id

          # Kiểm tra quyền truy cập dựa trên user_id (không phải id)
          unless farmer_id == current_user.user_id
            return render json: { error: "Chỉ hộ sản xuất mới có thể lên lịch thu hoạch cho sản phẩm của mình" }, status: :forbidden
          end

          marketplace_harvest = MarketplaceHarvest.new(marketplace_harvest_params)
          marketplace_harvest.product_listing = @product_listing
          marketplace_harvest.trader_id = params[:trader_id]

          # Nếu có product_order_id, liên kết với đơn hàng
          if params[:product_order_id].present?
            order = ProductOrder.find_by(id: params[:product_order_id])
            if order && (order.product_listing_id == @product_listing.id)
              marketplace_harvest.product_order = order
            end
          end

          if marketplace_harvest.save
            # Cập nhật trạng thái sản phẩm
            @product_listing.update(status: "reserved")

            # Tìm conversation
            conversation = find_conversation(@product_listing.id, marketplace_harvest.trader_id)

            if conversation
              # Gửi tin nhắn thông báo
              message_content = "Đã lên lịch thu hoạch cho sản phẩm #{@product_listing.title} vào #{marketplace_harvest.scheduled_date.strftime('%d/%m/%Y %H:%M')}. Địa điểm: #{marketplace_harvest.location}"

              FirebaseMessageService.save_message(conversation.id, {
                user_id: current_user.user_id,
                content: message_content,
                type: "schedule"
              })
            end

            render json: {
              message: "Đã lên lịch thu hoạch thành công",
              harvest: harvest_response(marketplace_harvest)
            }, status: :created
          else
            render json: { errors: marketplace_harvest.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/marketplace/harvests/:id
        def update
          unless @marketplace_harvest.can_be_managed_by?(current_user)
            return render json: { error: "Không có quyền cập nhật lịch thu hoạch này" }, status: :forbidden
          end

          # Kiểm tra xem có cập nhật trạng thái không
          status_changed = params[:marketplace_harvest] && params[:marketplace_harvest][:status] &&
                          params[:marketplace_harvest][:status].to_i != @marketplace_harvest.status_before_type_cast

          if @marketplace_harvest.update(marketplace_harvest_params)
            # Cập nhật trạng thái sản phẩm nếu trạng thái thu hoạch thay đổi
            if status_changed
              case @marketplace_harvest.status
              when "completed"
                @marketplace_harvest.product_listing.update(status: "sold")
                # Cập nhật đơn hàng nếu có
                if @marketplace_harvest.product_order
                  @marketplace_harvest.product_order.update(status: :completed)
                end
              when "cancelled"
                @marketplace_harvest.product_listing.update(status: "active")
              end
            end

            # Tìm conversation
            conversation = find_conversation(@marketplace_harvest.product_listing_id, @marketplace_harvest.trader_id)

            if conversation
              # Gửi tin nhắn thông báo
              content = if status_changed
                "Cập nhật trạng thái thu hoạch: #{@marketplace_harvest.status}"
              else
                "Cập nhật lịch thu hoạch sang ngày #{@marketplace_harvest.scheduled_date.strftime('%d/%m/%Y %H:%M')}. Địa điểm: #{@marketplace_harvest.location}"
              end

              FirebaseMessageService.save_message(conversation.id, {
                user_id: current_user.user_id,
                content: content,
                type: "schedule_update"
              })
            end

            render json: {
              message: "Đã cập nhật lịch thu hoạch thành công",
              harvest: harvest_response(@marketplace_harvest)
            }
          else
            render json: { errors: @marketplace_harvest.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/marketplace/harvests/:id/payment_proof
        def upload_payment_proof
          # Chỉ thương lái mới được cập nhật bằng chứng thanh toán
          unless @marketplace_harvest.trader_id == current_user.user_id
            return render json: { error: "Chỉ thương lái mới có thể cập nhật bằng chứng thanh toán" }, status: :forbidden
          end

          unless params[:image].present?
            return render json: { error: "Hình ảnh không được để trống" }, status: :unprocessable_entity
          end

          # Đính kèm hình ảnh
          @marketplace_harvest.payment_proof_image.attach(params[:image])

          # Cập nhật thông tin thanh toán
          @marketplace_harvest.update(
            final_price: params[:final_price],
            payment_date: params[:payment_date] || Time.current,
            status: :completed
          )

          # Cập nhật trạng thái sản phẩm
          @marketplace_harvest.product_listing.update(status: "sold")

          # Cập nhật đơn hàng nếu có
          if @marketplace_harvest.product_order
            @marketplace_harvest.product_order.update(
              status: :completed,
              final_price: params[:final_price]
            )
          end

          # Ghi nhận giao dịch
          create_sale_transaction(@marketplace_harvest)

          # Tìm conversation và gửi tin nhắn
          conversation = find_conversation(@marketplace_harvest.product_listing_id, @marketplace_harvest.trader_id)

          if conversation
            message_content = "Đã hoàn thành thanh toán #{params[:final_price]} đồng cho sản phẩm #{@marketplace_harvest.product_listing.title}"

            # Gửi tin nhắn với hình ảnh đính kèm
            FirebaseMessageService.save_message(conversation.id, {
              user_id: current_user.user_id,
              content: message_content,
              type: "payment",
              image_url: @marketplace_harvest.payment_proof_url,
              payment_info: {
                amount: params[:final_price],
                date: @marketplace_harvest.payment_date
              }
            })
          end

          render json: {
            message: "Đã cập nhật bằng chứng thanh toán thành công",
            harvest: harvest_response(@marketplace_harvest)
          }
        end

        # DELETE /api/v1/marketplace/harvests/:id
        def destroy
          # Kiểm tra quyền xóa (chỉ farmer hoặc trader liên quan mới có quyền xóa)
          unless @marketplace_harvest.can_be_managed_by?(current_user)
            return render json: { error: "Không có quyền xóa lịch thu hoạch này" }, status: :forbidden
          end

          # Lưu thông tin trước khi xóa để sử dụng trong tin nhắn
          product_title = @marketplace_harvest.product_listing.title
          scheduled_date = @marketplace_harvest.scheduled_date.strftime("%d/%m/%Y %H:%M")
          product_listing_id = @marketplace_harvest.product_listing_id
          trader_id = @marketplace_harvest.trader_id

          # Cập nhật trạng thái sản phẩm nếu đang reserved và chưa hoàn thành
          if @marketplace_harvest.product_listing.status == "reserved" &&
            @marketplace_harvest.status != "completed"
            @marketplace_harvest.product_listing.update(status: "active")
          end

          # Xóa marketplace_harvest
          if @marketplace_harvest.destroy
            # Tìm conversation
            conversation = find_conversation(product_listing_id, trader_id)

            if conversation
              # Gửi tin nhắn thông báo
              message_content = "Đã hủy lịch thu hoạch cho sản phẩm #{product_title} vào ngày #{scheduled_date}"

              FirebaseMessageService.save_message(conversation.id, {
                user_id: current_user.user_id,
                content: message_content,
                type: "schedule_cancel"
              })
            end

            render json: {
              message: "Đã xóa lịch thu hoạch thành công"
            }
          else
            render json: { error: "Không thể xóa lịch thu hoạch" }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/marketplace/harvests/active_by_product
        def active_by_product
          unless params[:product_listing_id].present?
            return render json: { error: "Thiếu thông tin sản phẩm" }, status: :unprocessable_entity
          end

          # Tìm lịch thu hoạch mới nhất của sản phẩm
          harvest = MarketplaceHarvest.where(product_listing_id: params[:product_listing_id])
                                   .order(created_at: :desc)
                                   .first

          if harvest
            render json: {
              harvest: harvest_response(harvest)
            }
          else
            render json: {
              message: "Không tìm thấy lịch thu hoạch cho sản phẩm này"
            }, status: :not_found
          end
        end

        private

        def set_marketplace_harvest
          @marketplace_harvest = MarketplaceHarvest.find_by(id: params[:id])
          render json: { error: "Không tìm thấy lịch thu hoạch" }, status: :not_found unless @marketplace_harvest
        end

        def set_product_listing
          @product_listing = ProductListing.find_by(id: params[:product_listing_id])
          render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found unless @product_listing
        end

        def marketplace_harvest_params
          params.require(:marketplace_harvest).permit(
            :scheduled_date,
            :location,
            :notes,
            :estimated_quantity,
            :actual_quantity,
            :estimated_price,
            :final_price,
            :status
          )
        end

        def harvest_response(harvest)
          {
            id: harvest.id,
            scheduled_date: harvest.scheduled_date,
            location: harvest.location,
            notes: harvest.notes,
            estimated_quantity: harvest.estimated_quantity,
            actual_quantity: harvest.actual_quantity,
            estimated_price: harvest.estimated_price,
            final_price: harvest.final_price,
            status: harvest.status,
            payment_proof_url: harvest.payment_proof_url,
            payment_date: harvest.payment_date,
            created_at: harvest.created_at,
            updated_at: harvest.updated_at,
            product_listing: {
              id: harvest.product_listing.id,
              title: harvest.product_listing.title,
              status: harvest.product_listing.status,
              product_type: harvest.product_listing.product_type,
              quantity: harvest.product_listing.quantity,
              price_expectation: harvest.product_listing.price_expectation,
              images: harvest.product_listing.product_images.map(&:image_url).compact
            },
            trader: User.find_by(user_id: harvest.trader_id)&.as_json(only: [ :user_id, :user_name, :fullname, :phone ]),
            farmer: harvest.farmer.as_json(only: [ :user_id, :user_name, :fullname, :phone ])
          }
        end

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

        def create_sale_transaction(harvest)
          return unless defined?(Transaction)

          # Tính tổng số tiền
          total_amount = harvest.final_price || (harvest.actual_quantity * harvest.estimated_price)

          # Ghi nhận doanh thu cho người bán (farmer)
          Transaction.create(
            user_id: harvest.product_listing.user_id,
            transaction_type: 1, # Đổi từ type thành transaction_type
            amount: total_amount,
            description: "Bán #{harvest.actual_quantity || harvest.estimated_quantity} #{harvest.product_listing.product_type} cho #{User.find_by(user_id: harvest.trader_id)&.fullname || 'Thương lái'}",
            date: harvest.payment_date || Time.current
          )
        end
      end
    end
  end
end
