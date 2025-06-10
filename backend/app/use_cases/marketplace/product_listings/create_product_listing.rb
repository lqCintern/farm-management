module Marketplace
  module ProductListings
    class CreateProductListing
      def initialize(repository)
        @repository = repository
      end

      def execute(attributes, user_id, images = [])
        # Thêm user_id vào attributes
        attributes[:user_id] = user_id

        begin
          # Chuyển status từ số hoặc string thành symbol
          status_symbol = if attributes[:status].is_a?(String) || attributes[:status].is_a?(Integer)
                            status_int = attributes[:status].to_i
                            case status_int
                            when 0 then :draft
                            when 2 then :sold
                            when 3 then :hidden
                            else :active # default là 1 (active)
                            end
                          else
                            attributes[:status] || :active
                          end
          
          # Khởi tạo entity mới từ attributes
          entity = Entities::Marketplace::ProductListing.new(
            attributes.merge(status: status_symbol)
          )

          # Lưu entity qua repository
          result = @repository.create(entity, images)

          if result
            {
              success: true,
              message: "Sản phẩm đã được tạo thành công",
              product_listing: result
            }
          else
            {
              success: false,
              errors: [ "Không thể tạo sản phẩm" ],
              message: "Không thể tạo sản phẩm"
            }
          end
        rescue => e
          {
            success: false,
            errors: [e.message],
            message: "Đã xảy ra lỗi khi tạo sản phẩm"
          }
        end
      end
    end
  end
end
