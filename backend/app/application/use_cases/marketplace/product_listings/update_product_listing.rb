module UseCases::Marketplace
  module ProductListings
    class UpdateProductListing
      def initialize(repository)
        @repository = repository
      end

      def execute(id, attributes, user_id, images = [], retained_image_ids = [])
        # Log để debug
        Rails.logger.info("Updating product #{id} with attributes: #{attributes.inspect}")
        Rails.logger.info("Images count: #{images.size}, Retained image IDs: #{retained_image_ids.inspect}")

        # Tìm sản phẩm hiện tại
        existing = @repository.find(id)

        unless existing
          return {
            success: false,
            errors: [ "Không tìm thấy sản phẩm" ],
            message: "Không tìm thấy sản phẩm"
          }
        end

        # Kiểm tra quyền sở hữu
        unless existing.user_id == user_id
          return {
            success: false,
            errors: [ "Bạn không có quyền cập nhật sản phẩm này" ],
            message: "Bạn không có quyền cập nhật sản phẩm này"
          }
        end

        # Cập nhật entity với attributes mới
        updated_entity = Entities::Marketplace::ProductListing.new(attributes.merge(id: id, user_id: user_id))

        # Lưu entity qua repository
        result = @repository.update(updated_entity, images, retained_image_ids)

        if result
          {
            success: true,
            message: "Sản phẩm đã được cập nhật thành công",
            product_listing: result
          }
        else
          {
            success: false,
            errors: [ "Không thể cập nhật sản phẩm" ],
            message: "Không thể cập nhật sản phẩm"
          }
        end
      rescue => e
        Rails.logger.error("Error in UpdateProductListing use case: #{e.message}\n#{e.backtrace.join("\n")}")
        {
          success: false,
          errors: [ e.message ],
          message: "Đã xảy ra lỗi khi cập nhật sản phẩm"
        }
      end
    end
  end
end
