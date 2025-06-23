module Presenters::Marketplace
  class ProductListingPresenter < BasePresenter
    # Format cơ bản cho my_listings
    def as_json
      {
        id: @object.id,
        title: @object.title,
        product_type: @object.product_type,
        quantity: @object.quantity,
        average_size: @object.average_size,
        price_expectation: @object.price_expectation,
        status: @object.status,
        province: @object.province,
        district: @object.district,
        thumbnail: @object.main_image_url,
        created_at: @object.created_at,
        view_count: @object.view_count,
        message_count: @object.message_count,
        order_count: @object.order_count
      }
    end

    # Format cho danh sách sản phẩm (index)
    def self.as_list_item(product)
      new(product).as_list_item
    end

    def as_list_item
      {
        id: @object.id,
        title: @object.title,
        product_type: @object.product_type,
        quantity: @object.quantity,
        average_size: @object.average_size,
        price_expectation: @object.price_expectation,
        status: @object.status,
        province: @object.province,
        district: @object.district,
        seller_name: @object.seller_name || @object.user_name,
        estimated_weight: @object.estimate_total_weight,
        location_text: @object.location_text,
        thumbnail: @object.main_image_url,
        created_at: @object.created_at
      }
    end

    # Format chi tiết với thông tin đầy đủ (show)
    def self.as_detail(product)
      new(product).as_detail
    end

    def as_detail
      {
        product_listing: {
          id: @object.id,
          title: @object.title,
          description: @object.description,
          product_type: @object.product_type,
          quantity: @object.quantity,
          average_size: @object.average_size,
          price_expectation: @object.price_expectation,
          status: @object.status,
          province: @object.province,
          district: @object.district,
          ward: @object.ward,
          address: @object.address,
          latitude: @object.latitude,
          longitude: @object.longitude,
          harvest_start_date: @object.harvest_start_date,
          harvest_end_date: @object.harvest_end_date,
          view_count: @object.view_count,
          message_count: @object.message_count,
          order_count: @object.order_count,
          location_text: @object.location_text,
          estimated_weight: @object.estimate_total_weight,
          google_maps_url: @object.google_maps_url,
          created_at: @object.created_at,
          updated_at: @object.updated_at,
          pineapple_crop: @object.pineapple_crop_data
        },
        seller: {
          id: @object.user_id,
          name: @object.seller_name || @object.user_name,
          rating: @object.seller_rating
        },
        product_images: @object.product_images.map(&:image_url)
      }
    end

    # Format cho create/update response
    def self.as_create_response(product, message = nil)
      {
        message: message || "Thao tác thành công",
        product_listing: {
          id: product.id,
          title: product.title,
          status: product.status
        }
      }
    end

    def self.format_create_response(result)
      if result[:success]
        # Format và trả về thông tin sản phẩm đã tạo
        product = result[:product_listing]
        {
          id: product.id,
          title: product.title,
          description: product.description,
          status: product.status,
          product_type: product.product_type,
          price_expectation: product.price_expectation,
          message: "Sản phẩm đã được tạo thành công"
        }
      else
        # Trả về thông báo lỗi nếu có
        {
          errors: result[:errors],
          message: result[:message] || "Không thể tạo sản phẩm"
        }
      end
    end

    # Format cho status update response
    def self.as_status_response(product, message = nil)
      {
        message: message || "Trạng thái đã được cập nhật",
        product_listing: {
          id: product.id,
          status: product.status
        }
      }
    end

    # Format collection với phân trang
    def self.present_collection(collection, pagination = nil)
      {
        items: collection.map { |item| new(item).as_json },
        pagination: pagination ? format_pagination(pagination) : nil
      }.compact
    end

    # Format pagination info
    def self.format_pagination(pagy)
      {
        current_page: pagy.page,
        total_pages: pagy.pages,
        total_items: pagy.count
      }
    end
  end
end
