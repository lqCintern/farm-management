# app/controllers/api/v1/product_listings_controller.rb
module Api
  module V1
    class ProductListingsController < ApplicationController
      include Pagy::Backend
      
      before_action :authenticate_user!
      before_action :set_product_listing, only: [:show, :update, :destroy, :toggle_status]
      before_action :authorize_user!, only: [:update, :destroy, :toggle_status]
      before_action :check_if_farmer, only: [:create, :update, :destroy, :toggle_status]
      
      # GET /api/v1/product_listings
      # Danh sách sản phẩm (public)
      def index
        product_listings = ProductListing.published
        Rails.logger.info "Published Listings Count: #{product_listings.count}"

        product_listings = apply_filters(product_listings)
        Rails.logger.info "Filtered Listings Count: #{product_listings.count}"

        # Sắp xếp theo ngày tạo mới nhất
        product_listings = product_listings.order(created_at: :desc)

        # Phân trang
        per_page = (params[:per_page] || 10).to_i
        page = (params[:page] || 1).to_i
        total_count = product_listings.count
        product_listings = product_listings.offset((page - 1) * per_page).limit(per_page)

        # Trả về dữ liệu
        render json: {
          product_listings: product_listings.as_json(include: {
            user: { only: [:user_id, :user_name, :fullname, :phone, :address] },
            product_images: { only: [], methods: [:image_url] }
          }),
          pagination: {
            page: page,
            per_page: per_page,
            total_count: total_count,
            total_pages: (total_count.to_f / per_page).ceil,
            next: page < (total_count.to_f / per_page).ceil ? page + 1 : nil,
            prev: page > 1 ? page - 1 : nil
          }
        }, status: :ok
      end
      
      # GET /api/v1/product_listings/:id
      # Chi tiết sản phẩm
      def show
        # Tăng lượt xem nếu không phải chủ sở hữu
        @product_listing.increment_view_count! unless @product_listing.user_id == current_user.user_id
        
        render json: {
          product_listing: @product_listing.as_json(include: {
            user: { only: [:user_id, :user_name, :fullname, :phone, :address] },
            product_images: { only: [], methods: [:image_url] },
            crop_animal: { only: [:id, :name, :crop_type] }
          })
        }, status: :ok
      end
      
      # POST /api/v1/product_listings
      # Tạo bài đăng mới
      def create
        product_listing = current_user.product_listings.build(product_listing_params)
        
        # Xử lý upload ảnh
        process_images(product_listing)
        
        if product_listing.save
            render json: {
            message: product_listing.status == 0 ? "Đã lưu bản nháp" : "Đã đăng bài thành công", # Kiểm tra trực tiếp giá trị status
            product_listing: product_listing.as_json(include: {
                product_images: { only: [], methods: [:image_url] }
            })
            }, status: :created
        else
            render json: { errors: product_listing.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PUT/PATCH /api/v1/product_listings/:id
      # Cập nhật bài đăng
      def update
        # Không cho phép sửa nếu đã có đơn đặt hàng được chấp nhận
        if @product_listing.has_been_ordered? && !@product_listing.draft?
          return render json: { error: "Không thể sửa bài đăng đã có người đặt mua" }, status: :forbidden
        end
        
        # Không cho sửa vị trí (tỉnh, huyện, xã) nếu đã đăng công khai (trừ bản nháp)
        if !@product_listing.draft? && location_params_changed?
          return render json: { error: "Không thể thay đổi vị trí cho bài đăng đã công khai. Hãy tạo bài đăng mới." }, status: :forbidden
        end
        
        # Xử lý upload ảnh
        process_images(@product_listing)
        
        if @product_listing.update(product_listing_params)
          render json: {
            message: @product_listing.draft? ? "Đã cập nhật bản nháp" : "Đã cập nhật bài đăng",
            product_listing: @product_listing.as_json(include: {
              product_images: { only: [], methods: [:image_url] }
            })
          }, status: :ok
        else
          render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/product_listings/:id
      # Xóa bài đăng
      def destroy
        # Không cho xóa nếu đã có đơn đặt hàng được chấp nhận
        if @product_listing.has_been_ordered? && !@product_listing.draft?
          return render json: { error: "Không thể xóa bài đăng đã có người đặt mua" }, status: :forbidden
        end
        
        if @product_listing.destroy
          render json: { message: "Đã xóa bài đăng thành công" }, status: :ok
        else
          render json: { errors: @product_listing.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PUT /api/v1/product_listings/:id/toggle_status
      # Thay đổi trạng thái (active/hide/draft)
      def toggle_status
        case params[:status]
        when "activate"
          @product_listing.active!
          message = "Đã kích hoạt bài đăng"
        when "hide"
          @product_listing.hidden!
          message = "Đã ẩn bài đăng"
        when "draft"
          # Chỉ chuyển thành draft nếu chưa có đơn đặt hàng
          if @product_listing.has_been_ordered?
            return render json: { error: "Không thể chuyển thành bản nháp vì đã có người đặt mua" }, status: :forbidden
          end
          
          @product_listing.draft!
          message = "Đã chuyển thành bản nháp"
        else
          return render json: { error: "Trạng thái không hợp lệ" }, status: :bad_request
        end
        
        render json: { message: message, status: @product_listing.status }, status: :ok
      end
      
      private
      
      def set_product_listing
        @product_listing = ProductListing.find_by(id: params[:id])
        render json: { error: "Không tìm thấy bài đăng" }, status: :not_found unless @product_listing
      end
      
      def authorize_user!
        unless @product_listing.user_id == current_user.user_id
          render json: { error: "Bạn không có quyền thực hiện hành động này" }, status: :forbidden
        end
      end
      
      def check_if_farmer
        unless current_user.farmer?
          render json: { error: "Chỉ hộ sản xuất mới có thể thực hiện hành động này" }, status: :forbidden
        end
      end
      
      def product_listing_params
        params.require(:product_listing).permit(
          :title, :description, :status, :product_type, :quantity, 
          :total_weight, :average_size, :price_expectation,
          :province, :district, :ward, :address, :latitude, :longitude,
          :harvest_start_date, :harvest_end_date, :crop_animal_id,
          product_images_attributes: [:id, :image_path, :position, :_destroy]
        )
      end
      
      def apply_filters(product_listings)
        # Chỉ áp dụng bộ lọc nếu tham số tồn tại
        product_listings = product_listings.by_product_type(params[:product_type]) if params[:product_type].present?
        product_listings = product_listings.by_location(params[:province]) if params[:province].present?
        product_listings = product_listings.by_price_range(params[:min_price], params[:max_price]) if params[:min_price].present? && params[:max_price].present?
        product_listings = product_listings.ready_to_harvest if params[:ready_to_harvest].present? && params[:ready_to_harvest] == 'true'
        product_listings = product_listings.where(user_id: params[:user_id]) if params[:user_id].present?

        # Tìm kiếm theo từ khóa trong tiêu đề hoặc mô tả
        if params[:query].present?
          query = "%#{params[:query]}%"
          product_listings = product_listings.where("title LIKE ? OR description LIKE ?", query, query)
        end

        product_listings
      end
      
      def location_params_changed?
        return false unless params[:product_listing]
        
        location_params = [:province, :district, :ward]
        location_params.any? do |param|
          params[:product_listing][param].present? && 
          params[:product_listing][param] != @product_listing.send(param)
        end
      end
      
      def process_images(product_listing)
        return unless params[:images].present?

        # Đảm bảo params[:images] luôn là một mảng
        images = params[:images].is_a?(Array) ? params[:images] : [params[:images]]

        images.each_with_index do |image, index|
            # Tạo ProductImage record
            product_image = product_listing.product_images.build(position: index)

            # Lưu trước để có ID
            product_image.save

            # Đính kèm hình ảnh thông qua Active Storage
            product_image.image.attach(image)
        end
      end
    end
  end
end
