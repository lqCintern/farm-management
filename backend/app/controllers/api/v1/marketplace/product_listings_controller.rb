module Api
  module V1
    module Marketplace
      class ProductListingsController < BaseController
        before_action :authenticate_user!
        before_action :set_product_listing, only: [:show, :update, :destroy, :mark_as_sold, :mark_as_hidden]
        before_action :authorize_user!, only: [:update, :destroy, :mark_as_sold, :mark_as_hidden]

        # GET /api/v1/product_listings
        def index
          # Lấy danh sách sản phẩm với các bộ lọc
          @product_listings = ProductListing.published
            .by_product_type(params[:product_type])
            .by_location(params[:province])
            .includes(:product_images, :user)
            .order(created_at: :desc)

          # Áp dụng phân trang
          @pagy, @product_listings = pagy(@product_listings, items: params[:per_page] || 12)

          render json: {
            product_listings: @product_listings,
            pagination: {
              current_page: @pagy.page,
              total_pages: @pagy.pages,
              total_items: @pagy.count
            }
          }
        end

        # GET /api/v1/product_listings/:id
        def show
          # Tăng lượt xem khi xem chi tiết
          @product_listing.increment_view_count! unless current_user&.id == @product_listing.user_id
          
          # Lấy thông tin bổ sung từ pineapple_crop nếu có
          if @product_listing.crop_animal_id.present?
            pineapple_crop = PineappleCrop.find_by(id: @product_listing.crop_animal_id)
            @product_listing_data = @product_listing.as_json.merge(
              pineapple_crop: pineapple_crop.as_json(only: [:variety, :planting_date, :field_id, :current_stage])
            )
          else
            @product_listing_data = @product_listing
          end

          render json: {
            product_listing: @product_listing_data,
            seller: @product_listing.user.as_json(only: [:id, :user_name, :fullname, :avatar_url]),
            product_images: @product_listing.product_images.map(&:image_url)
          }
        end

        # POST /api/v1/product_listings
        def create
          # Tạo sản phẩm mới từ dữ liệu được gửi lên
          @product_listing = current_user.product_listings.new(product_listing_params)
          
          # Xử lý trường min_size và max_size để tính average_size
          if params[:product_listing][:min_size].present? && params[:product_listing][:max_size].present?
            min_size = params[:product_listing][:min_size].to_f
            max_size = params[:product_listing][:max_size].to_f
            @product_listing.average_size = (min_size + max_size) / 2
          end
          
          # Thêm các trường bổ sung không có trong strong parameters
          @product_listing.variety = params[:product_listing][:variety] if params[:product_listing][:variety].present?
          @product_listing.location_note = params[:product_listing][:locationNote] if params[:product_listing][:locationNote].present?
          
          # Xử lý coordinates nếu được gửi lên
          if params[:product_listing][:coordinates].present?
            begin
              coordinates = JSON.parse(params[:product_listing][:coordinates])
              # Tính trung tâm nếu cần
              if coordinates.is_a?(Array) && coordinates.any?
                lat_sum = lng_sum = 0
                coordinates.each do |coord|
                  lat_sum += coord["lat"].to_f
                  lng_sum += coord["lng"].to_f
                end
                @product_listing.latitude = lat_sum / coordinates.size
                @product_listing.longitude = lng_sum / coordinates.size
              end
            rescue JSON::ParserError => e
              Rails.logger.error("Error parsing coordinates: #{e.message}")
            end
          end

          # Xử lý hình ảnh nếu có
          if params[:images].present?
            params[:images].each_with_index do |image_url, index|
              @product_listing.product_images.build(image_path: image_url, position: index)
            end
          end

          if @product_listing.save
            render json: {
              message: "Sản phẩm đã được tạo thành công",
              product_listing: @product_listing
            }, status: :created
          else
            render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PUT /api/v1/product_listings/:id
        def update
          # Cập nhật thông tin sản phẩm
          
          # Xử lý trường min_size và max_size để tính average_size
          if params[:product_listing][:min_size].present? && params[:product_listing][:max_size].present?
            min_size = params[:product_listing][:min_size].to_f
            max_size = params[:product_listing][:max_size].to_f
            params[:product_listing][:average_size] = (min_size + max_size) / 2
          end
          
          if @product_listing.update(product_listing_params)
            render json: {
              message: "Sản phẩm đã được cập nhật thành công",
              product_listing: @product_listing
            }
          else
            render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
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
          if @product_listing.update(status: ProductListing::STATUS_SOLD)
            render json: {
              message: "Sản phẩm đã được đánh dấu là đã bán",
              product_listing: @product_listing
            }
          else
            render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/product_listings/:id/mark_as_hidden
        def mark_as_hidden
          if @product_listing.update(status: ProductListing::STATUS_HIDDEN)
            render json: {
              message: "Sản phẩm đã được ẩn",
              product_listing: @product_listing
            }
          else
            render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/product_listings/my_listings
        def my_listings
          @product_listings = current_user.product_listings.order(created_at: :desc)
          
          # Lọc theo trạng thái nếu có
          if params[:status].present?
            case params[:status]
            when 'active'
              @product_listings = @product_listings.published
            when 'sold'
              @product_listings = @product_listings.sold
            when 'hidden'
              @product_listings = @product_listings.hidden
            when 'draft'
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
          @product_listing = ProductListing.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found
        end
        
        def authorize_user!
          unless @product_listing.user_id == current_user.id
            render json: { error: "Bạn không có quyền truy cập sản phẩm này" }, status: :forbidden
          end
        end
        
        def product_listing_params
          params.require(:product_listing).permit(
            :title, :description, :status, :product_type, :quantity, 
            :total_weight, :average_size, :price_expectation,
            :province, :district, :ward, :address, :latitude, :longitude,
            :harvest_start_date, :harvest_end_date, :crop_animal_id,
            :min_size, :max_size, :variety, :location_note, # Thêm các trường mới
            product_images_attributes: [:id, :image_path, :position, :_destroy]
          )
        end
      end
    end
  end
end
