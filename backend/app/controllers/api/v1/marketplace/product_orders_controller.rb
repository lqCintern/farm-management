# app/controllers/api/v1/product_orders_controller.rb
module Api
  module V1
    module Marketplace
      class ProductOrdersController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!
        before_action :set_product_order, only: [ :show, :update ]
        before_action :authorize_order_action, only: [ :update ]

        # GET /api/v1/product_orders
        def index
          if current_user.farmer?
            orders = ::Marketplace::ProductOrder.for_seller(current_user.user_id)
          else
            orders = current_user.product_orders
          end

          # Filter by status
          if params[:status].present?
            orders = orders.where(status: params[:status])
          end

          @pagy, orders = pagy(orders.includes(:product_listing).order(created_at: :desc), items: params[:per_page] || 10)
          
          order_service = ::Marketplace::ProductOrderService.new(nil, current_user)
          stats = order_service.get_order_statistics(current_user)

          render json: {
            orders: orders.as_json(include: {
              product_listing: {
                include: { product_images: { methods: [ :image_url ], limit: 1 } },
                only: [ :id, :title, :product_type, :quantity, :price_expectation ]
              },
              buyer: { only: [ :user_id, :user_name, :fullname, :phone ] }
            }),
            pagination: {
              count: @pagy.count,
              page: @pagy.page,
              pages: @pagy.pages,
              last: @pagy.last,
              next: @pagy.next,
              prev: @pagy.prev
            },
            statistics: stats
          }, status: :ok
        end

        # GET /api/v1/product_orders/:id
        def show
          render json: {
            order: @product_order.as_json(include: {
              product_listing: {
                include: {
                  user: { only: [ :user_id, :user_name, :fullname, :phone ] },
                  product_images: { methods: [ :image_url ] }
                }
              },
              buyer: { only: [ :user_id, :user_name, :fullname, :phone ] }
            })
          }, status: :ok
        end

        # POST /api/v1/product_orders
        def create
          product_order = ::Marketplace::ProductOrder.new(product_order_params)
          service = ::Marketplace::ProductOrderService.new(product_order, current_user)
          result = service.create(product_order_params)
          
          if result[:success]
            render json: {
              message: "Đã gửi yêu cầu đặt mua thành công",
              order: result[:order].as_json(include: { product_listing: { only: [ :id, :title ] } }),
              conversation_id: result[:conversation_id]
            }, status: :created
          else
            render json: { errors: result[:errors] || [result[:error]] }, 
                   status: result[:status] || :unprocessable_entity
          end
        end

        # PUT/PATCH /api/v1/product_orders/:id
        def update
          # Cập nhật trạng thái
          if params[:status].present?
            service = ::Marketplace::ProductOrderService.new(@product_order, current_user)
            result = service.update_status(params[:status], params[:reason])
            
            if result[:success]
              render json: {
                message: result[:message],
                status: result[:status],
                order: @product_order.as_json(include: {
                  product_listing: { only: [ :id, :title, :status ] }
                })
              }, status: :ok
            else
              render json: { error: result[:error] }, status: :unprocessable_entity
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
          @product_order = ::Marketplace::ProductOrder.find_by(id: params[:id])
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
      end
    end
  end
end
