module Repositories
  module SupplyChain
    class SupplyImageRepository
      def create(entity)
        record = ::SupplyChain::SupplyImage.new(
          supply_listing_id: entity.supply_listing_id,
          position: entity.position
        )
        
        # Xử lý upload hình ảnh
        if entity.image_url.is_a?(ActionDispatch::Http::UploadedFile)
          record.image = entity.image_url
        end
        
        if record.save
          { success: true, image: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end
      
      def delete_all_by_listing(listing_id)
        ::SupplyChain::SupplyImage.where(supply_listing_id: listing_id).destroy_all
        { success: true }
      end
      
      def get_next_position(listing_id)
        max_position = ::SupplyChain::SupplyImage.where(supply_listing_id: listing_id)
                                               .maximum(:position)
        
        (max_position || -1) + 1
      end
      
      private
      
      def map_to_entity(record)
        Entities::SupplyChain::SupplyImage.new(
          id: record.id,
          supply_listing_id: record.supply_listing_id,
          image_url: record.image_url,
          position: record.position,
          created_at: record.created_at,
          updated_at: record.updated_at
        )
      end
    end
  end
end