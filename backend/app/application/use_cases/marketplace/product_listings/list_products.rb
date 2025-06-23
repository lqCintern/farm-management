module UseCases::Marketplace
  module ProductListings
    class ListProducts
      def initialize(repository)
        @repository = repository
      end

      # Phương thức này nhận các params như một hash hoặc keyword arguments
      def execute(options = {})
        # Nếu không phải là hash, chuyển về hash
        params = options.is_a?(Hash) ? options : {}

        # Thiết lập giá trị mặc định cho các tham số nếu chưa có
        params[:product_type] ||= nil
        params[:province] ||= nil
        params[:min_price] ||= nil
        params[:max_price] ||= nil
        params[:ready_to_harvest] ||= nil
        params[:sort] ||= nil
        params[:page] ||= 1
        params[:per_page] ||= 12

        # Log để debug
        Rails.logger.info("Listing products with params: #{params.inspect}")

        @repository.list_published(params)
      end
    end
  end
end
