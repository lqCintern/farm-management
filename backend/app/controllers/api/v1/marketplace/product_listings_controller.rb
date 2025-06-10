module Api
  module V1
    module Marketplace
      class ProductListingsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!, except: [ :index, :show ]
        before_action :set_product_listing, only: [ :update, :destroy, :mark_as_sold, :mark_as_hidden ]
        before_action :authorize_user!, only: [ :update, :destroy, :mark_as_sold, :mark_as_hidden ]

        # GET /api/v1/marketplace/product_listings
        def index
          filter_params = ::Marketplace::ProductListingFormatter.format_filter_params(params)
          pagy, products = CleanArch.marketplace_list_products.execute(filter_params)
          product_listings_response = products.map { |product| 
            ::Marketplace::ProductListingPresenter.as_list_item(product) 
          }

          render json: {
            product_listings: product_listings_response,
            pagination: {
              current_page: pagy.page,
              total_pages: pagy.pages,
              total_items: pagy.count
            }
          }
        end

        # GET /api/v1/marketplace/product_listings/:id
        def show
          result = CleanArch.marketplace_get_product_details.execute(params[:id])

          if result[:success]
            render json: ::Marketplace::ProductListingPresenter.as_detail(result[:product_listing])
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        # POST /api/v1/marketplace/product_listings
        def create
          create_params = ::Marketplace::ProductListingFormatter.format_create_params(
            params.require(:product_listing).to_h,
            current_user.user_id
          )
          images = ::Marketplace::ProductListingFormatter.format_images(
            params[:product_listing][:images]
          )
          result = CleanArch.marketplace_create_product_listing.execute(
            create_params[:basic_attributes],
            create_params[:user_id],
            images
          )

          if result[:success]
            render json: ::Marketplace::ProductListingPresenter.format_create_response(result),
                   status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # PUT /api/v1/marketplace/product_listings/:id
        def update
          update_params = ::Marketplace::ProductListingFormatter.format_update_params(
            params.require(:product_listing).to_h,
            current_user.user_id
          )
          
          images = ::Marketplace::ProductListingFormatter.format_images_with_ids(
            params[:product_listing][:images]
          )

          result = CleanArch.marketplace_update_product_listing.execute(
            params[:id],
            update_params[:basic_attributes],
            update_params[:user_id],
            images
          )

          if result[:success]
            render json: ::Marketplace::ProductListingFormatter.format_update_response(result)
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/marketplace/product_listings/:id
        def destroy
          if CleanArch.marketplace_delete_product_listing.execute(params[:id], current_user.user_id)
            render json: { message: "Sản phẩm đã được xóa thành công" }
          else
            render json: { errors: [ "Không thể xóa sản phẩm" ] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/marketplace/product_listings/:id/mark_as_sold
        def mark_as_sold
          result = CleanArch.marketplace_change_product_status.execute(
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
          result = CleanArch.marketplace_change_product_status.execute(
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
          my_listings_params = ::Marketplace::ProductListingFormatter.format_my_listings_params(
            params,
            current_user.user_id
          )
          
          pagy, listings = CleanArch.marketplace_list_my_listings.execute(**my_listings_params)

          response = ::Marketplace::ProductListingPresenter.present_collection(listings, pagy)
          render json: { product_listings: response[:items], pagination: response[:pagination] }
        end

        private

        def set_product_listing
          # This simply finds the record for authorization
          @product_listing = ::Marketplace::ProductListing.find_by(id: params[:id])
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
