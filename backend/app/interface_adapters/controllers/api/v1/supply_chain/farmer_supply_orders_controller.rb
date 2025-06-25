module Controllers::Api
  module V1
    module SupplyChain
      class FarmerSupplyOrdersController < BaseController
        before_action :authenticate_user!

        # GET /api/v1/supply_orders
        def index
          result = Services::CleanArch.farmer_list_orders.execute(
            current_user.user_id,
            { status: params[:status] }
          )

          if result[:success]
            render json: {
              status: "success",
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: result[:errors].join(", ")
            }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/supply_orders/:id
        def show
          result = Services::CleanArch.farmer_get_order_details.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              status: "success",
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: result[:errors].join(", ")
            }, status: :not_found
          end
        end

        # POST /api/v1/supply_orders
        def create
          result = Services::CleanArch.farmer_create_order.execute(
            current_user.user_id,
            supply_order_params.to_h.merge(supply_listing_id: params[:supply_listing_id])
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message],
              data: result[:data]
            }, status: :created
          else
            render json: {
              status: "error",
              message: "Không thể đặt hàng",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supply_orders/:id
        def update
          result = Services::CleanArch.farmer_update_order.execute(
            params[:id],
            current_user.user_id,
            supply_order_params
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message],
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: "Không thể cập nhật đơn hàng",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supply_orders/:id/cancel
        def cancel
          result = Services::CleanArch.farmer_cancel_order.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message],
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: "Không thể hủy đơn hàng",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supply_orders/:id/complete
        def complete
          result = Services::CleanArch.farmer_complete_order_and_update_inventory.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              status: "success",
              message: "Xác nhận nhận hàng thành công",
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: result[:error] || "Không thể xác nhận nhận hàng",
              errors: result[:errors] || (result[:error] ? [result[:error]] : nil)
            }, status: :unprocessable_entity
          end
        end

        private

        def supply_order_params
          params.require(:supply_order).permit(
            :quantity, 
            :note, 
            :delivery_province, 
            :delivery_district, 
            :delivery_ward, 
            :delivery_address,
            :contact_phone, 
            :payment_method,
            :price
          )
        end
      end
    end
  end
end
