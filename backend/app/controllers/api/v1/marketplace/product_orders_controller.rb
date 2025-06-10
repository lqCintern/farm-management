# app/controllers/api/v1/product_orders_controller.rb
module Api
  module V1
    module Marketplace
      class ProductOrdersController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!

        # GET /api/v1/marketplace/product_orders
        def index
          # Formatter để chuẩn hóa input params
          filter_params = ::Marketplace::ProductOrderFormatter.format_filter_params(
            user_id: current_user.user_id,
            user_type: current_user.user_type,
            status: params[:status],
            page: params[:page],
            per_page: params[:per_page]
          )

          # Gọi use case với params đã được format
          # Sử dụng double splat operator (**) để chuyển hash thành keyword arguments
          result = CleanArch.marketplace_list_orders.execute(**filter_params)

          # Sử dụng Presenter để format response
          render json: ::Marketplace::ProductOrderPresenter.format_index_response(result),
                 status: :ok
        end

        # GET /api/v1/marketplace/product_orders/:id
        def show
          result = CleanArch.marketplace_get_order_details.execute(
            params[:id],
            current_user.user_id
          )

          response_data = ::Marketplace::ProductOrderPresenter.format_show_response(result)

          if result[:success]
            render json: response_data, status: :ok
          else
            render json: response_data, status: :not_found
          end
        end

        # POST /api/v1/marketplace/product_orders
        def create
          # Formatter để chuẩn hóa input params
          create_params = ::Marketplace::ProductOrderFormatter.format_create_params(
            product_order_params.to_h,
            current_user.user_id
          )

          # Gọi use case với params đã format
          result = CleanArch.marketplace_create_order.execute(create_params)

          # Presenter định dạng response
          response_data = ::Marketplace::ProductOrderPresenter.format_create_response(result)

          if result[:success]
            render json: response_data, status: :created
          else
            render json: response_data, status: result[:status] || :unprocessable_entity
          end
        end

        # PUT/PATCH /api/v1/marketplace/product_orders/:id
        def update
          if params[:status].present?
            # Formatter chuẩn hóa input params cho update status
            status_params = ::Marketplace::ProductOrderFormatter.format_status_params(
              params[:id],
              params[:status],
              current_user.user_id,
              params[:reason]
            )

            # Gọi use case với params đã format
            result = CleanArch.marketplace_update_order_status.execute(
              status_params[:order_id],
              status_params[:new_status],
              status_params[:user_id],
              status_params[:reason]
            )

            # Presenter định dạng response
            response_data = ::Marketplace::ProductOrderPresenter.format_status_update_response(result)

            if result[:success]
              render json: response_data, status: :ok
            else
              render json: response_data, status: :unprocessable_entity
            end
          else
            # Formatter chuẩn hóa input params cho update details
            update_params = ::Marketplace::ProductOrderFormatter.format_update_params(
              product_order_update_params.to_h
            )

            # Gọi use case với params đã format
            result = CleanArch.marketplace_update_order_details.execute(
              params[:id],
              update_params,
              current_user.user_id
            )

            # Presenter định dạng response
            response_data = ::Marketplace::ProductOrderPresenter.format_update_response(result)

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
