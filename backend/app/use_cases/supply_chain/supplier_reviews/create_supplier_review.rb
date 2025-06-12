module SupplyChain
  module SupplierReviews
    class CreateSupplierReview
      def initialize(repository)
        @repository = repository
      end
      
      def execute(user_id, params)
        # Create entity
        entity = Entities::SupplyChain::SupplierReview.new(
          reviewer_id: user_id,
          supply_order_id: params[:supply_order_id],
          rating: params[:rating],
          content: params[:content]
        )
        
        # Validate entity
        validation_errors = entity.validate
        return { success: false, errors: validation_errors } if validation_errors.any?
        
        # Create review
        result = @repository.create(entity)
        
        if result[:success]
          review_dto = Dtos::SupplyChain::SupplierReviewDto.new(result[:review])
          { success: true, data: review_dto, message: "Đánh giá thành công" }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end