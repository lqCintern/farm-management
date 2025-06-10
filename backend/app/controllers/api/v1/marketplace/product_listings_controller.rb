module Api
  module V1
    module Marketplace
      class ProductListingsController < BaseController
        before_action :authenticate_user!
        before_action :set_product_listing, only: [ :show, :update, :destroy, :mark_as_sold, :mark_as_hidden ]
        before_action :authorize_user!, only: [ :update, :destroy, :mark_as_sold, :mark_as_hidden ]

        # GET /api/v1/product_listings
        def index
          # Lấy danh sách sản phẩm với các bộ lọc
          @product_listings = ::Marketplace::ProductListing.published
            .by_product_type(params[:product_type])
            .by_location(params[:province])
            .includes(:product_images, :user)
            .order(created_at: :desc)

          # Áp dụng phân trang
          @pagy, @product_listings = pagy(@product_listings, items: params[:per_page] || 12)

          # Cập nhật cách xử lý ảnh
          product_listings_with_images = @product_listings.map do |listing|
            listing_json = listing.as_json
            
            # Xử lý ảnh đặc biệt, tránh lỗi với ActiveStorage
            begin
              images = listing.product_images.map do |pi|
                pi.image.attached? ? pi.image_url : nil
              end.compact
              
              listing_json[:images] = images
              listing_json[:thumbnail] = images.first
            rescue => e
              Rails.logger.error("Error processing images for listing #{listing.id}: #{e.message}")
              listing_json[:images] = []
              listing_json[:thumbnail] = nil
            end
            
            listing_json
          end

          render json: {
            product_listings: product_listings_with_images,
            pagination: {
              current_page: @pagy.page,
              total_pages: @pagy.pages,
              total_items: @pagy.count
            }
          }
        end

        # GET /api/v1/product_listings/:id
        def show
          service = ::Marketplace::ProductListingService.new(@product_listing, current_user)
          service.increment_view
          
          # Lấy thông tin bổ sung từ pineapple_crop nếu có
          if @product_listing.crop_animal_id.present?
            pineapple_crop = ::Farming::PineappleCrop.find_by(id: @product_listing.crop_animal_id)
            @product_listing_data = @product_listing.as_json.merge(
              pineapple_crop: pineapple_crop&.as_json(only: [ :variety, :planting_date, :field_id, :current_stage ])
            )
          else
            @product_listing_data = @product_listing
          end

          render json: {
            product_listing: @product_listing_data,
            seller: @product_listing.user.as_json(only: [ :id, :user_name, :fullname, :avatar_url ]),
            product_images: @product_listing.product_images.map(&:image_url)
          }
        end

        # POST /api/v1/product_listings
        def create
          # Tạo sản phẩm mới từ dữ liệu được gửi lên
          @product_listing = current_user.product_listings.new(product_listing_params)
          service = ::Marketplace::ProductListingService.new(@product_listing, current_user)
          result = service.create(params[:product_listing])
          
          if result[:success]
            render json: {
              message: result[:message],
              product_listing: result[:product_listing]
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # PUT /api/v1/product_listings/:id
        def update
          service = ::Marketplace::ProductListingService.new(@product_listing, current_user)
          result = service.update(params[:product_listing])
          
          if result[:success]
            render json: {
              message: result[:message],
              product_listing: result[:product_listing],
              product_images: result[:product_images]
            }
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/product_listings/:id
        def destroy
          if @product_listing.destroy
            render json: { message: "Sản phẩm đã được xóa thành công" }
          else
            render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/product_listings/:id/mark_as_sold
        def mark_as_sold
          service = ::Marketplace::ProductListingService.new(@product_listing, current_user)
          result = service.change_status("sold")
          
          if result[:success]
            render json: {
              message: result[:message],
              product_listing: result[:product_listing]
            }
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/product_listings/:id/mark_as_hidden
        def mark_as_hidden
          service = ::Marketplace::ProductListingService.new(@product_listing, current_user)
          result = service.change_status("hidden")
          
          if result[:success]
            render json: {
              message: result[:message],
              product_listing: result[:product_listing]
            }
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/product_listings/my_listings
        def my_listings
          @product_listings = current_user.product_listings.order(created_at: :desc)

          # Lọc theo trạng thái nếu có
          if params[:status].present?
            case params[:status]
            when "active"
              @product_listings = @product_listings.published
            when "sold"
              @product_listings = @product_listings.sold
            when "hidden"
              @product_listings = @product_listings.hidden
            when "draft"
              @product_listings = @product_listings.draft
            end
          end

          # Áp dụng phân trang
          @pagy, @product_listings = pagy(@product_listings, items: params[:per_page] || 10)

          render json: {
            product_listings: @product_listings,
            pagination: {
              current_page: @pagy.page,
              total_pages: @pagy.pages,
              total_items: @pagy.count
            }
          }
        end

        # GET /api/v1/product_listings/drafts
        def drafts
          @drafts = current_user.product_listings.draft.order(created_at: :desc)
          @pagy, @drafts = pagy(@drafts, items: params[:per_page] || 10)

          render json: {
            drafts: @drafts,
            pagination: {
              current_page: @pagy.page,
              total_pages: @pagy.pages,
              total_items: @pagy.count
            }
          }
        end

        private

        def set_product_listing
          @product_listing = ::Marketplace::ProductListing.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found
        end

        def authorize_user!
          unless @product_listing.user_id == current_user.user_id
            render json: { error: "Bạn không có quyền truy cập sản phẩm này" }, status: :forbidden
          end
        end

        def product_listing_params
          params.require(:product_listing).permit(
            :title, :description, :status, :product_type, :quantity,
            :total_weight, :average_size, :price_expectation,
            :province, :district, :ward, :address, :latitude, :longitude,
            :harvest_start_date, :harvest_end_date, :crop_animal_id,
            :min_size, :max_size, :variety, :location_note,
            product_images_attributes: [ :id, :image_path, :position, :_destroy ]
          )
        end
      end
    end
  end
end
