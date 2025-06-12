module Api
  module V1
    module SupplyChain
      class SupplyOrdersController < BaseController
        before_action :authenticate_user!
        before_action :ensure_supplier
        
        # GET /api/v1/supplier/supply_orders
        def index
          result = CleanArch.supplier_list_orders.execute(
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
        
        # GET /api/v1/supplier/supply_orders/:id
        def show
          result = CleanArch.supplier_get_order_details.execute(params[:id])
          
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
        
        # PUT /api/v1/supplier/supply_orders/:id
        def update
          result = CleanArch.supplier_update_order_status.execute(
            params[:id],
            params[:status],
            params[:rejection_reason]
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
        
        # GET /api/v1/supplier/dashboard
        def dashboard
          result = CleanArch.supplier_get_dashboard.execute(current_user.user_id)
          
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
        
        private
        
        def ensure_supplier
          unless current_user.supplier?
            render json: {
              status: "error",
              message: "Bạn không có quyền truy cập chức năng này"
            }, status: :forbidden
          end
        end
      end
    end
  end
end
