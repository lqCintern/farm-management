module Marketplace
  class ProductListingService
    def initialize(product_listing, user)
      @product_listing = product_listing
      @user = user
    end
    
    def create(params)
      # Xử lý trường min_size và max_size để tính average_size
      if params[:min_size].present? && params[:max_size].present?
        min_size = params[:min_size].to_f
        max_size = params[:max_size].to_f
        @product_listing.average_size = (min_size + max_size) / 2
      end
      
      # Thêm các trường bổ sung không có trong strong parameters
      @product_listing.variety = params[:variety] if params[:variety].present?
      @product_listing.location_note = params[:locationNote] if params[:locationNote].present?
      
      # Xử lý coordinates nếu được gửi lên
      process_coordinates(params[:coordinates]) if params[:coordinates].present?
      
      # Xử lý hình ảnh nếu có
      process_images(params[:images]) if params[:images].present?
      
      if @product_listing.save
        { success: true, message: "Sản phẩm đã được tạo thành công", product_listing: @product_listing }
      else
        { success: false, errors: @product_listing.errors.full_messages }
      end
    end
    
    def update(params)
      # Xử lý trường min_size và max_size để tính average_size
      if params[:min_size].present? && params[:max_size].present?
        min_size = params[:min_size].to_f
        max_size = params[:max_size].to_f
        params[:average_size] = (min_size + max_size) / 2
      end
      
      # Xử lý hình ảnh mới nếu có
      if params[:images].present?
        process_new_images(params[:images])
      end
      
      # Xử lý retained_image_ids nếu có
      process_retained_images(params[:retained_image_ids]) if params.key?(:retained_image_ids)
      
      if @product_listing.update(params.except(:images, :retained_image_ids))
        { 
          success: true, 
          message: "Sản phẩm đã được cập nhật thành công", 
          product_listing: @product_listing, 
          product_images: @product_listing.product_images.map(&:image_url) 
        }
      else
        { success: false, errors: @product_listing.errors.full_messages }
      end
    end
    
    def increment_view
      unless @user&.user_id == @product_listing.user_id
        @product_listing.increment_view_count!
      end
    end
    
    def change_status(status)
      case status
      when "sold"
        status_code = ::Marketplace::ProductListing::STATUS_SOLD
        message = "Sản phẩm đã được đánh dấu là đã bán"
      when "hidden"
        status_code = ::Marketplace::ProductListing::STATUS_HIDDEN
        message = "Sản phẩm đã được ẩn"
      else
        return { success: false, error: "Trạng thái không hợp lệ" }
      end
      
      if @product_listing.update(status: status_code)
        { success: true, message: message, product_listing: @product_listing }
      else
        { success: false, errors: @product_listing.errors.full_messages }
      end
    end
    
    private
    
    def process_coordinates(coordinates_json)
      begin
        coordinates = JSON.parse(coordinates_json)
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
    
    def process_images(images)
      images.each_with_index do |image_url, index|
        @product_listing.product_images.build(image_path: image_url, position: index)
      end
    end
    
    def process_new_images(images)
      # Log để debug
      Rails.logger.info "Processing #{images.length} new images"
      
      images.each_with_index do |image, index|
        # Tìm vị trí cuối cùng
        last_position = @product_listing.product_images.maximum(:position) || -1
        new_position = last_position + index + 1
        
        # Tạo ảnh mới
        img = @product_listing.product_images.build(position: new_position)
        img.image.attach(image)
        Rails.logger.info "Attached new image at position #{new_position}"
      end
    end
    
    def process_retained_images(retained_image_ids)
      if retained_image_ids.present?
        retained_ids = retained_image_ids.reject(&:blank?).map(&:to_i)
        Rails.logger.info "Retaining image IDs: #{retained_ids.inspect}"
        
        # Xóa các ảnh không còn trong danh sách giữ lại
        @product_listing.product_images.where.not(id: retained_ids).destroy_all
        Rails.logger.info "Deleted images not in retained list"
      elsif retained_image_ids == [""] || retained_image_ids == []
        # Nếu retained_image_ids là mảng rỗng, xóa tất cả ảnh cũ
        Rails.logger.info "Empty retained_image_ids, deleting all existing images"
        @product_listing.product_images.destroy_all
      end
    end
  end
end