module Api
  module V1
    module SupplyChain
      class SupplyOrdersController < BaseController
        before_action :authenticate_user!
        before_action :ensure_supplier
        before_action :set_supply_order, only: [ :show, :update ]

        # GET /api/v1/supplier/supply_orders
        def index
          @supply_orders = ::SupplyChain::SupplyOrder.joins(:supply_listing)
                                    .where(supply_listings: { user_id: current_user.user_id })
                                    .includes(:user, supply_listing: [ :supply_images ])
                                    .order(created_at: :desc)

          # Lọc theo trạng thái nếu có
          @supply_orders = @supply_orders.where(status: params[:status]) if params[:status].present?

          render json: {
            status: "success",
            data: @supply_orders.map { |order| supply_order_json(order) }
          }
        end

        # GET /api/v1/supplier/supply_orders/:id
        def show
          render json: {
            status: "success",
            data: supply_order_json(@supply_order, true)
          }
        end

        # PUT /api/v1/supplier/supply_orders/:id
        def update
          # Lưu trạng thái cũ để xử lý logic
          old_status = @supply_order.status
          
          # Sử dụng service object để xử lý cập nhật trạng thái
          service = ::SupplyChain::OrderService.new(@supply_order, current_user)
          result = service.update_status(params[:status], params[:rejection_reason])

          if result[:success]
            # Ghi nhật ký hoạt động
            log_order_activity(old_status, @supply_order.status)
            
            render json: {
              status: "success",
              message: result[:message],
              data: supply_order_json(@supply_order)
            }
          else
            render json: {
              status: "error",
              message: result[:error],
              errors: result[:errors]
            }, status: result[:status] || :unprocessable_entity
          end
        end

        # GET /api/v1/supplier/dashboard
        def dashboard
          # Sử dụng service object để lấy thống kê
          service = ::SupplyChain::SupplierDashboardService.new(current_user)
          stats = service.get_dashboard_stats
          
          render json: {
            status: "success",
            data: stats
          }
        end

        private

        def set_supply_order
          @supply_order = ::SupplyChain::SupplyOrder.joins(:supply_listing)
                                   .where(supply_listings: { user_id: current_user.user_id })
                                   .find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: {
            status: "error",
            message: "Không tìm thấy đơn hàng"
          }, status: :not_found
        end

        def supply_order_json(order, detailed = false)
          json = {
            id: order.id,
            status: order.status,
            quantity: order.quantity,
            price: order.price,
            total: order.quantity * order.price,
            created_at: order.created_at,
            supply_listing: {
              id: order.supply_listing.id,
              name: order.supply_listing.name,
              image: order.supply_listing.supply_images.sorted.first&.image_url
            },
            buyer: {
              id: order.user.user_id,
              name: order.user.user_name,
              phone: order.user.phone
            }
          }

          if detailed
            json.merge!({
              note: order.note,
              rejection_reason: order.rejection_reason,
              delivery_province: order.delivery_province,
              delivery_district: order.delivery_district,
              delivery_ward: order.delivery_ward,
              delivery_address: order.delivery_address,
              contact_phone: order.contact_phone,
              payment_method: order.payment_method,
              is_paid: order.is_paid
            })
          end

          json
        end

        def ensure_supplier
          unless current_user.supplier?
            render json: {
              status: "error",
              message: "Bạn không có quyền truy cập chức năng này"
            }, status: :forbidden
          end
        end

        # Thêm phương thức ghi nhật ký
        def log_order_activity(old_status, new_status)
          ActivityLog.create(
            user_id: current_user.id,
            action_type: "order_status_change",
            target_type: 'SupplyOrder',
            target_id: @supply_order.id,
            details: {
              old_status: old_status,
              new_status: new_status,
              order_quantity: @supply_order.quantity,
              product_name: @supply_order.supply_listing.name
            }
          )
        end
      end
    end
  end
end
