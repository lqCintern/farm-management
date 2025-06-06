module Api
  module V1
    module SupplyChain
      class SupplyOrdersController < BaseController
        before_action :authenticate_user!
        before_action :set_supply_order, only: [ :show, :update, :complete, :cancel ]

        # GET /api/v1/supply_orders
        def index
          @supply_orders = current_user.supply_orders
                                    .includes(supply_listing: [ :user, { supply_images: { image_attachment: :blob } } ])
                                    .order(created_at: :desc)

          # Lọc theo trạng thái nếu có
          @supply_orders = @supply_orders.where(status: params[:status]) if params[:status].present?

          render json: {
            status: "success",
            data: @supply_orders.map { |order| supply_order_json(order) }
          }
        end

        # GET /api/v1/supply_orders/:id
        def show
          render json: {
            status: "success",
            data: supply_order_json(@supply_order, true)
          }
        end

        # POST /api/v1/supply_orders
        def create
          @supply_listing = SupplyListing.find(params[:supply_listing_id])

          # Kiểm tra số lượng tồn kho
          if @supply_listing.quantity < params[:quantity].to_f
            render json: {
              status: "error",
              message: "Số lượng vật tư không đủ"
            }, status: :unprocessable_entity
            return
          end

          @supply_order = current_user.supply_orders.build(supply_order_params)
          @supply_order.supply_listing_id = @supply_listing.id
          @supply_order.price = @supply_listing.price
          @supply_order.purchase_date = Time.current

          if @supply_order.save
            # Tăng số lượng đơn hàng của vật tư
            @supply_listing.increment!(:order_count)

            render json: {
              status: "success",
              message: "Đặt hàng thành công",
              data: supply_order_json(@supply_order)
            }, status: :created
          else
            render json: {
              status: "error",
              message: "Không thể đặt hàng",
              errors: @supply_order.errors
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supply_orders/:id/cancel
        def cancel
          # Chỉ có thể hủy đơn hàng ở trạng thái pending
          if @supply_order.pending?
            if @supply_order.update(status: :cancelled)
              render json: {
                status: "success",
                message: "Hủy đơn hàng thành công",
                data: { status: @supply_order.status }
              }
            else
              render json: {
                status: "error",
                message: "Không thể hủy đơn hàng",
                errors: @supply_order.errors
              }, status: :unprocessable_entity
            end
          else
            render json: {
              status: "error",
              message: "Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận"
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supply_orders/:id/complete
        def complete
          # Chỉ có thể hoàn thành đơn hàng ở trạng thái đã giao
          if @supply_order.delivered?
            if @supply_order.update(status: :completed)
              # Cập nhật farm_materials của người dùng
              update_farm_materials

              render json: {
                status: "success",
                message: "Xác nhận nhận hàng thành công",
                data: { status: @supply_order.status }
              }
            else
              render json: {
                status: "error",
                message: "Không thể xác nhận nhận hàng",
                errors: @supply_order.errors
              }, status: :unprocessable_entity
            end
          else
            render json: {
              status: "error",
              message: "Chỉ có thể xác nhận nhận hàng khi đơn hàng đã được giao"
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supply_orders/:id
        def update
          if @supply_order.update(supply_order_params)
            render json: {
              status: "success",
              message: "Cập nhật đơn hàng thành công",
              data: supply_order_json(@supply_order)
            }
          else
            render json: {
              status: "error",
              message: "Không thể cập nhật đơn hàng",
              errors: @supply_order.errors
            }, status: :unprocessable_entity
          end
        end

        private

        def set_supply_order
          @supply_order = current_user.supply_orders.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: {
            status: "error",
            message: "Không tìm thấy đơn hàng"
          }, status: :not_found
        end

        def supply_order_params
          params.require(:supply_order).permit(
            :quantity, :note, :delivery_province, :delivery_district,
            :delivery_ward, :delivery_address, :contact_phone, :payment_method
          )
        end

        def supply_order_json(order, detailed = false)
          json = {
            id: order.id,
            status: order.status,
            quantity: order.quantity,
            price: order.price,
            total: order.quantity * order.price,
            created_at: order.created_at,
            purchase_date: order.purchase_date,
            supply_listing: {
              id: order.supply_listing.id,
              name: order.supply_listing.name,
              image: order.supply_listing.supply_images.sorted.first&.image_url
            },
            supplier: {
              id: order.supply_listing.user.user_id,
              name: order.supply_listing.user.user_name,
              phone: order.supply_listing.user.phone
            }
          }

          if detailed
            # Kiểm tra xem đã đánh giá chưa
            has_review = SupplierReview.exists?(supply_order_id: order.id, reviewer_id: current_user.user_id)

            json.merge!({
              note: order.note,
              rejection_reason: order.rejection_reason,
              delivery_province: order.delivery_province,
              delivery_district: order.delivery_district,
              delivery_ward: order.delivery_ward,
              delivery_address: order.delivery_address,
              contact_phone: order.contact_phone,
              payment_method: order.payment_method,
              is_paid: order.is_paid,
              has_review: has_review,
              supply_listing: {
                id: order.supply_listing.id,
                name: order.supply_listing.name,
                category: order.supply_listing.category,
                unit: order.supply_listing.unit,
                brand: order.supply_listing.brand,
                manufacturer: order.supply_listing.manufacturer,
                image: order.supply_listing.supply_images.sorted.first&.image_url
              }
            })
          end

          json
        end

        def update_farm_materials
          supply = @supply_order.supply_listing

          # Tìm hoặc tạo farm_material tương ứng
          farm_material = current_user.farm_materials.find_or_initialize_by(
            name: supply.name,
            unit: supply.unit,
            category: supply.category
          )

          if farm_material.new_record?
            # Nếu là vật tư mới
            farm_material.quantity = @supply_order.quantity
            farm_material.material_id = supply.id # Lưu id của supply_listing gốc
            farm_material.last_updated = Time.current
            farm_material.save
          else
            # Nếu đã có vật tư, cộng thêm số lượng
            farm_material.increment!(:quantity, @supply_order.quantity)
            farm_material.update(last_updated: Time.current)
          end
        end
      end
    end
  end
end
