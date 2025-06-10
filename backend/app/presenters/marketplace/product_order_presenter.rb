module Marketplace
  class ProductOrderPresenter < BasePresenter
    # Format cơ bản cho danh sách đơn hàng
    def as_json
      {
        id: @object.id,
        status: @object.status,
        quantity: @object.quantity,
        price: @object.price,
        total_amount: @object.total_amount || (@object.quantity * @object.price),
        note: @object.note,
        created_at: @object.created_at,
        updated_at: @object.updated_at,
        product_listing: {
          id: @object.product_listing.id,
          title: @object.product_listing.title,
          product_type: @object.product_listing.product_type,
          main_image_url: @object.product_listing.main_image_url
        },
        buyer: {
          id: @object.buyer_id,
          # Sửa: Truy cập đúng vào hash buyer
          name: @object.buyer ? (@object.buyer[:fullname] || @object.buyer[:user_name]) : nil
        },
        seller: {
          id: @object.product_listing.user_id,
          name: @object.product_listing.seller_name
        }
      }
    end

    def as_detail
      {
        id: @object.id,
        status: @object.status,
        quantity: @object.quantity,
        price: @object.price,
        total_amount: @object.total_amount || (@object.quantity * @object.price),
        note: @object.note,
        rejection_reason: @object.rejection_reason,
        created_at: @object.created_at,
        updated_at: @object.updated_at,
        product_listing: {
          id: @object.product_listing.id,
          title: @object.product_listing.title,
          description: @object.product_listing.description,
          product_type: @object.product_listing.product_type,
          average_size: @object.product_listing.average_size,
          price_expectation: @object.product_listing.price_expectation,
          province: @object.product_listing.province,
          district: @object.product_listing.district,
          address: @object.product_listing.address,
          main_image_url: @object.product_listing.main_image_url
        },
        buyer: {
          id: @object.buyer_id,
          # Sửa: Truy cập đúng các thuộc tính từ hash buyer
          name: @object.buyer ? (@object.buyer[:fullname] || @object.buyer[:user_name]) : nil,
          phone: @object.buyer ? @object.buyer[:phone] : nil,
          address: @object.buyer ? @object.buyer[:address] : nil
        },
        seller: {
          id: @object.product_listing.user_id,
          name: @object.product_listing.seller_name
        }
      }
    end

    # Hoàn thiện các phương thức format khác
    def self.format_index_response(result)
      {
        orders: result[:orders].map { |order| new(order).as_json },
        pagination: format_pagination(result[:pagy]),
        statistics: result[:statistics]
      }
    end

    def self.format_show_response(result)
      if result[:success]
        { order: as_detail(result[:order]) }
      else
        { error: result[:error] }
      end
    end

    def self.format_create_response(result)
      if result[:success]
        {
          message: result[:message] || "Đơn hàng đã được tạo thành công",
          order: new(result[:order]).as_json,
          conversation_id: result[:conversation_id]
        }
      else
        { errors: result[:errors] || [ result[:error] ] }
      end
    end

    def self.format_update_response(result)
      if result[:success]
        {
          message: result[:message] || "Đơn hàng đã được cập nhật",
          order: new(result[:order]).as_json
        }
      else
        { errors: result[:errors] || [ result[:error] ] }
      end
    end

    def self.format_status_update_response(result)
      if result[:success]
        {
          message: result[:message] || "Trạng thái đơn hàng đã được cập nhật",
          status: result[:order].status,
          order: new(result[:order]).as_json
        }
      else
        { error: result[:error] }
      end
    end

    def self.format_pagination(pagy)
      {
        count: pagy.count,
        page: pagy.page,
        pages: pagy.pages,
        last: pagy.last,
        next: pagy.next,
        prev: pagy.prev
      }
    end
  end
end
