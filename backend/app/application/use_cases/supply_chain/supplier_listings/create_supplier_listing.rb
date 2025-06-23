module UseCases::SupplyChain
  module SupplierListings
    class CreateSupplierListing
      def initialize(repository, image_repository)
        @repository = repository
        @image_repository = image_repository
      end

      def execute(params, user_id, images = nil)
        # Create entity
        listing_entity = Entities::SupplyChain::SupplyListing.new(
          params.merge(user_id: user_id, status: params[:status] || "draft")
        )

        # Validate entity
        validation_errors = listing_entity.validate
        return { success: false, errors: validation_errors } if validation_errors.any?

        # Create record
        result = @repository.create(listing_entity)

        # Process images if successful
        if result[:success] && images.present?
          process_images(result[:listing].id, images)
        end

        if result[:success]
          listing_dto = Dtos::SupplyChain::SupplyListingDto.new(result[:listing])
          { success: true, data: listing_dto, message: "Đăng vật tư thành công" }
        else
          { success: false, errors: result[:errors] }
        end
      end

      private

      def process_images(listing_id, images)
        images.each_with_index do |image_data, index|
          image_entity = Entities::SupplyChain::SupplyImage.new(
            supply_listing_id: listing_id,
            position: index,
            image_url: image_data
          )
          @image_repository.create(image_entity)
        end
      end
    end
  end
end
