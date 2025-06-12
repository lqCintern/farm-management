module Marketplace
  module ProductListings
    class ChangeProductStatus
      def initialize(repository)
        @repository = repository
      end

      def execute(id, status, current_user_id)
        # Find product listing
        product_listing = @repository.find(id)
        return { success: false, errors: [ "Sản phẩm không tồn tại" ] } unless product_listing

        # Check authorization
        return { success: false, errors: [ "Bạn không có quyền thay đổi trạng thái sản phẩm này" ] } unless product_listing.user_id == current_user_id

        # Validate status
        unless [ "draft", "active", "sold", "hidden" ].include?(status.to_s)
          return { success: false, errors: [ "Trạng thái không hợp lệ" ] }
        end

        # Change status
        result = @repository.change_status(id, status)

        if result
          # Return success with appropriate message
          message = case status.to_s
          when "sold"
                      "Sản phẩm đã được đánh dấu là đã bán"
          when "hidden"
                      "Sản phẩm đã được ẩn"
          when "active"
                      "Sản phẩm đã được kích hoạt"
          when "draft"
                      "Sản phẩm đã được chuyển về trạng thái nháp"
          end

          {
            success: true,
            message: message,
            product_listing: result
          }
        else
          {
            success: false,
            errors: [ "Không thể thay đổi trạng thái sản phẩm" ]
          }
        end
      end
    end
  end
end
