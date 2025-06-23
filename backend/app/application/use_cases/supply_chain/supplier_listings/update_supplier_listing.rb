module UseCases::SupplyChain
  module SupplierListings
    class UpdateSupplierListing
      def initialize(repository, image_repository)
        @repository = repository
        @image_repository = image_repository
      end

      def execute(listing_id, params, user_id, images = nil, delete_images = false)
        # Verify ownership
        find_result = @repository.find_by_id_and_user(listing_id, user_id)
        return { success: false, errors: [ "Không tìm thấy vật tư" ] } unless find_result[:success]

        # Update listing
        result = @repository.update(listing_id, params)

        # Process images if needed
        if result[:success] && (images.present? || delete_images)
          process_images(listing_id, images, delete_images)
        end

        if result[:success]
          listing_dto = Dtos::SupplyChain::SupplyListingDto.new(result[:listing])
          { success: true, data: listing_dto, message: "Cập nhật vật tư thành công" }
        else
          { success: false, errors: result[:errors] }
        end
      end

      private

      def process_images(listing_id, images, delete_all = false)
        # Delete all existing images if requested
        if delete_all
          @image_repository.delete_all_by_listing(listing_id)
        end

        # Add new images
        if images.present?
          current_position = @image_repository.get_next_position(listing_id)

          images.each_with_index do |image_data, index|
            image_entity = Entities::SupplyChain::SupplyImage.new(
              supply_listing_id: listing_id,
              position: current_position + index,
              image_url: image_data
            )
            @image_repository.create(image_entity)
          end
        end
      end
    end
  end
end
