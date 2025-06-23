module Controllers::Api
  module V1
    module Marketplace
      class ProductListingsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!, except: [ :index, :show ]
        before_action :set_product_listing, only: [ :update, :destroy, :mark_as_sold, :mark_as_hidden ]
        before_action :authorize_user!, only: [ :update, :destroy, :mark_as_sold, :mark_as_hidden ]

        # GET /api/v1/marketplace/product_listings
        def index
          filter_params = {
            product_type: params[:product_type],
            province: params[:province],
            min_price: params[:min_price],
            max_price: params[:max_price],
            ready_to_harvest: params[:ready_to_harvest] == "true",
            sort: params[:sort],
            page: params[:page] || 1,
            per_page: params[:per_page] || 12
          }

          result = Services::CleanArch.marketplace_list_products.execute(filter_params)
          pagy = result[0]
          products = result[1]

          # Sử dụng phương thức presenter_collection hiện có
          response = ::Presenters::Marketplace::ProductListingPresenter.present_collection(
            products,
            pagy
          )

          render json: response
        rescue => e
          Rails.logger.error("Error in product listing: #{e.message}\n#{e.backtrace.join("\n")}")
          render json: { error: "Đã xảy ra lỗi khi lấy danh sách sản phẩm" }, status: :internal_server_error
        end

        # GET /api/v1/marketplace/product_listings/:id
        def show
          result = Services::CleanArch.marketplace_get_product_details.execute(params[:id])

          if result[:success]
            render json: ::Presenters::Marketplace::ProductListingPresenter.as_detail(result[:product_listing])
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        # POST /api/v1/marketplace/product_listings
        def create
          begin
            # Đảm bảo tất cả các trường được permit đầy đủ
            permitted_params = params.require(:product_listing).permit(
              :title, :description, :status, :product_type, :quantity,
              :total_weight, :average_size, :price_expectation,
              :province, :district, :ward, :address, :latitude, :longitude,
              :harvest_start_date, :harvest_end_date, :crop_animal_id, :field_id
            )

            create_params = ::Formatters::Marketplace::ProductListingFormatter.format_create_params(
              permitted_params.to_h,
              current_user.user_id
            )

            images = params[:images] || []

            result = Services::CleanArch.marketplace_create_product_listing.execute(
              create_params[:basic_attributes],
              create_params[:user_id],
              images
            )

            if result[:success]
              render json: ::Presenters::Marketplace::ProductListingPresenter.format_create_response(result),
                    status: :created
            else
              render json: { errors: result[:errors] }, status: :unprocessable_entity
            end
          rescue ActionController::ParameterMissing => e
            render json: { error: e.message }, status: :bad_request
          rescue => e
            Rails.logger.error("Error in product creation: #{e.message}\n#{e.backtrace.join("\n")}")
            render json: { error: "Unexpected error occurred" }, status: :internal_server_error
          end
        end

        # PUT /api/v1/marketplace/product_listings/:id
        def update
          begin
            # Thêm explicit permit parameters trước khi gọi to_h
            permitted_params = params.require(:product_listing).permit(
              :title, :description, :status, :product_type, :quantity,
              :total_weight, :average_size, :price_expectation,
              :province, :district, :ward, :address, :latitude, :longitude,
              :harvest_start_date, :harvest_end_date, :crop_animal_id, :field_id,
              :google_maps_url, :min_size, :max_size
            )

            update_params = ::Formatters::Marketplace::ProductListingFormatter.format_update_params(
              permitted_params.to_h,
              current_user.user_id
            )

            # Xử lý hình ảnh giữ lại
            retained_image_ids = params[:retained_image_ids] || []
            retained_image_ids = retained_image_ids.select(&:present?)

            # Xử lý hình ảnh mới
            new_images = params[:images] || []

            Rails.logger.info("Retained image IDs: #{retained_image_ids.inspect}")
            Rails.logger.info("New images count: #{new_images.size}")

            result = Services::CleanArch.marketplace_update_product_listing.execute(
              params[:id],
              update_params[:basic_attributes],
              update_params[:user_id],
              new_images,
              retained_image_ids
            )

            if result[:success]
              render json: {
                success: true,
                product: result[:product_listing],
                message: result[:message]
              }
            else
              render json: {
                success: false,
                errors: result[:errors],
                message: result[:message]
              }, status: :unprocessable_entity
            end
          rescue ActionController::ParameterMissing => e
            render json: { error: e.message }, status: :bad_request
          rescue => e
            Rails.logger.error("Error in product update: #{e.message}\n#{e.backtrace.join("\n")}")
            render json: { error: "Đã xảy ra lỗi không mong muốn" }, status: :internal_server_error
          end
        end

        # DELETE /api/v1/marketplace/product_listings/:id
        def destroy
          if Services::CleanArch.marketplace_delete_product_listing.execute(params[:id], current_user.user_id)
            render json: { message: "Sản phẩm đã được xóa thành công" }
          else
            render json: { errors: [ "Không thể xóa sản phẩm" ] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/marketplace/product_listings/:id/mark_as_sold
        def mark_as_sold
          result = Services::CleanArch.marketplace_change_product_status.execute(
            params[:id],
            "sold",
            current_user.user_id
          )

          if result[:success]
            render json: ::Marketplace::ProductListingFormatter.format_status_update_response(result)
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/marketplace/product_listings/:id/mark_as_hidden
        def mark_as_hidden
          result = Services::CleanArch.marketplace_change_product_status.execute(
            params[:id],
            "hidden",
            current_user.user_id
          )

          if result[:success]
            render json: ::Marketplace::ProductListingFormatter.format_status_update_response(result)
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/marketplace/product_listings/my_listings
        def my_listings
          my_listings_params = ::Formatters::Marketplace::ProductListingFormatter.format_my_listings_params(
            params,
            current_user.user_id
          )

          pagy, listings = Services::CleanArch.marketplace_list_my_listings.execute(**my_listings_params)

          response = ::Presenters::Marketplace::ProductListingPresenter.present_collection(listings, pagy)
          render json: { product_listings: response[:items], pagination: response[:pagination] }
        end

        private

        def set_product_listing
          # This simply finds the record for authorization
          @product_listing = ::Models::Marketplace::ProductListing.find_by(id: params[:id])
          render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found unless @product_listing
        end

        def authorize_user!
          unless @product_listing.user_id == current_user.user_id
            render json: { error: "Bạn không có quyền truy cập sản phẩm này" }, status: :forbidden
          end
        end
      end
    end
  end
end
