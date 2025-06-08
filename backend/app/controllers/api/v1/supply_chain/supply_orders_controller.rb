module Api
  module V1
    module SupplyChain
      class SupplyOrdersController < BaseController
        before_action :authenticate_user!
        before_action :ensure_supplier
        before_action :set_supply_order, only: [ :show, :update ]

        # GET /api/v1/supplier/supply_orders
        def index
          @supply_orders = SupplyOrder.joins(:supply_listing)
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

          ActiveRecord::Base.transaction do
            if params[:status].present?
              case params[:status]
              when "confirmed"
                # Xác nhận đơn hàng
                @supply_order.status = :confirmed
                
                # Kiểm tra số lượng tồn kho thực tế
                listing = @supply_order.supply_listing
                if listing.quantity >= @supply_order.quantity
                  # Giảm số lượng tồn kho thực tế
                  listing.decrement!(:quantity, @supply_order.quantity)
                  
                  # Giảm số lượng đang tạm giữ
                  listing.decrement!(:pending_quantity, @supply_order.quantity)
                  
                  # Cập nhật trạng thái nếu hết hàng
                  if listing.quantity <= 0
                    listing.update(status: :sold_out)
                  end
                else
                  # Không đủ hàng để xác nhận
                  @supply_order.update(status: :rejected, rejection_reason: "Số lượng vật tư không đủ")
                  raise ActiveRecord::Rollback
                  render json: {
                    status: "error",
                    message: "Số lượng vật tư không đủ để đáp ứng đơn hàng"
                  }, status: :unprocessable_entity
                  return
                end
                
              when "shipped"
                # Chuyển sang trạng thái đang giao hàng
                @supply_order.status = :shipped
                
              when "delivered"
                # Chuyển sang trạng thái đã giao hàng
                @supply_order.status = :delivered
                
              when "rejected"
                # Từ chối đơn hàng
                @supply_order.status = :rejected
                @supply_order.rejection_reason = params[:rejection_reason]
                
                # Nếu đơn đã được xác nhận, cần trả lại số lượng vật tư
                if old_status == "confirmed"
                  @supply_order.supply_listing.increment!(:quantity, @supply_order.quantity)
                  
                  # Cập nhật lại trạng thái nếu trước đó là hết hàng
                  if @supply_order.supply_listing.status == "sold_out" && @supply_order.supply_listing.quantity > 0
                    @supply_order.supply_listing.update(status: :active)
                  end
                elsif old_status == "pending"
                  # Nếu từ chối đơn đang chờ, giảm số lượng đang tạm giữ
                  @supply_order.supply_listing.decrement!(:pending_quantity, @supply_order.quantity)
                end
              end
            end

            if @supply_order.save
              # Ghi nhật ký hoạt động
              log_order_activity(old_status, @supply_order.status)
              
              render json: {
                status: "success",
                message: "Cập nhật trạng thái đơn hàng thành công",
                data: supply_order_json(@supply_order)
              }
            else
              raise ActiveRecord::Rollback
              render json: {
                status: "error",
                message: "Không thể cập nhật đơn hàng",
                errors: @supply_order.errors
              }, status: :unprocessable_entity
            end
          end
        end

        # GET /api/v1/supplier/dashboard
        def dashboard
          # Thống kê số lượng đơn hàng theo trạng thái
          order_stats = SupplyOrder.joins(:supply_listing)
                                  .where(supply_listings: { user_id: current_user.user_id })
                                  .group(:status)
                                  .count

          # Thống kê doanh thu
          revenue = SupplyOrder.joins(:supply_listing)
                              .where(supply_listings: { user_id: current_user.user_id })
                              .where(status: [ :completed, :delivered ])
                              .sum("supply_orders.price * supply_orders.quantity")

          # Thống kê vật tư theo danh mục
          listing_stats = current_user.supply_listings
                                      .group(:category)
                                      .count

          render json: {
            status: "success",
            data: {
              order_stats: order_stats,
              revenue: revenue,
              listing_stats: listing_stats,
              pending_orders: SupplyOrder.joins(:supply_listing)
                                       .where(supply_listings: { user_id: current_user.user_id })
                                       .where(status: :pending)
                                       .count,
              reviews_avg: current_user.average_rating
            }
          }
        end

        private

        def set_supply_order
          @supply_order = SupplyOrder.joins(:supply_listing)
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
