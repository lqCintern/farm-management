# app/controllers/api/v1/product_orders_controller.rb
module Controllers::Api
  module V1
    module Marketplace
      class ProductOrdersController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!

        # GET /api/v1/marketplace/product_orders
        def index
          filter_params = ::Models::Marketplace::ProductOrderFormatter.format_filter_params(
            user_id: current_user.user_id,
            user_type: current_user.user_type,
            status: params[:status],
            page: params[:page],
            per_page: params[:per_page]
          )

          result = Services::CleanArch.marketplace_list_orders.execute(**filter_params)

          render json: ::Marketplace::ProductOrderPresenter.format_index_response(result),
                 status: :ok
        end

        # GET /api/v1/marketplace/product_orders/:id
        def show
          result = Services::CleanArch.marketplace_get_order_details.execute(
            params[:id],
            current_user.user_id
          )

          response_data = ::Models::Marketplace::ProductOrderPresenter.format_show_response(result)

          if result[:success]
            render json: response_data, status: :ok
          else
            render json: response_data, status: :not_found
          end
        end

        # POST /api/v1/marketplace/product_orders
        def create
          permitted_params = params.require(:product_order).permit(
            :product_listing_id, :quantity, :price, :note
          )

          # Sửa lỗi ở đây: Thêm current_user.user_id làm tham số thứ hai
          result = Services::CleanArch.marketplace_create_order.execute(
            permitted_params.to_h,  # Tham số thứ nhất: attributes
            current_user.user_id    # Tham số thứ hai: user_id
          )

          if result[:success]
            render json: {
              success: true,
              message: result[:message],
              order: result[:order],
              conversation_id: result[:conversation_id]
            }, status: :created
          else
            status = result[:status] || :unprocessable_entity
            render json: {
              success: false,
              error: result[:error] || result[:errors]&.join(", ") || "Không thể tạo đơn hàng"
            }, status: status
          end
        rescue ActionController::ParameterMissing => e
          render json: { success: false, error: e.message }, status: :bad_request
        rescue => e
          Rails.logger.error("Error creating order: #{e.message}\n#{e.backtrace.join("\n")}")
          render json: { success: false, error: "Đã xảy ra lỗi khi tạo đơn hàng" }, status: :internal_server_error
        end

        # PUT/PATCH /api/v1/marketplace/product_orders/:id
        def update
          if params[:status].present?
            status_params = ::Models::Marketplace::ProductOrderFormatter.format_status_params(
              params[:id],
              params[:status],
              current_user.user_id,
              params[:reason]
            )

            result = Services::CleanArch.marketplace_update_order_status.execute(
              status_params[:order_id],
              status_params[:new_status],
              status_params[:user_id],
              status_params[:reason]
            )

            # Presenter định dạng response
            response_data = ::Models::Marketplace::ProductOrderPresenter.format_status_update_response(result)

            if result[:success]
              render json: response_data, status: :ok
            else
              render json: response_data, status: :unprocessable_entity
            end
          else
            update_params = ::Models::Marketplace::ProductOrderFormatter.format_update_params(
              product_order_update_params.to_h
            )

            result = Services::CleanArch.marketplace_update_order_details.execute(
              params[:id],
              update_params,
              current_user.user_id
            )

            response_data = ::Models::Marketplace::ProductOrderPresenter.format_update_response(result)

            if result[:success]
              render json: response_data, status: :ok
            else
              render json: response_data, status: :unprocessable_entity
            end
          end
        end

        private

        def product_order_params
          params.require(:product_order).permit(
            :product_listing_id, :quantity, :price, :note
          )
        end

        def product_order_update_params
          params.require(:product_order).permit(:quantity, :price, :note)
        end
      end
    end
  end
end
