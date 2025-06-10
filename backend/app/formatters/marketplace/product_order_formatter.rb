module Marketplace
  class ProductOrderFormatter
    # Format params cho filter/tìm kiếm đơn hàng
    def self.format_filter_params(params = {})
      {
        user_id: params[:user_id],
        user_type: params[:user_type],
        status: params[:status],
        page: params[:page] || 1,
        per_page: params[:per_page] || 10
      }
    end

    # Format params cho tạo đơn hàng
    def self.format_create_params(params, user_id)
      {
        product_listing_id: params[:product_listing_id],
        quantity: params[:quantity],
        price: params[:price],
        note: params[:note],
        buyer_id: user_id
      }
    end
    
    # Format params cho cập nhật đơn hàng
    def self.format_update_params(params)
      {
        quantity: params[:quantity],
        price: params[:price],
        note: params[:note]
      }.compact
    end

    # Format params cho cập nhật trạng thái đơn hàng
    def self.format_status_params(order_id, status, user_id, reason = nil)
      {
        order_id: order_id,
        new_status: status,
        user_id: user_id,
        reason: reason
      }
    end
  end
end
