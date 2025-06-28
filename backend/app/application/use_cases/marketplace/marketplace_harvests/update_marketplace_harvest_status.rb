module UseCases::Marketplace
  module MarketplaceHarvests
    class UpdateMarketplaceHarvestStatus
      def initialize(repository, harvest_repository)
        @repository = repository
        @harvest_repository = harvest_repository
      end

      def execute(id, attributes, user_id)
        # Tìm đơn thu hoạch 
        marketplace_harvest = @repository.find_with_associations(id)
        return { success: false, errors: ["Không tìm thấy đơn thu hoạch"] } unless marketplace_harvest

        old_status = marketplace_harvest.status
        old_actual_quantity = marketplace_harvest.actual_quantity
        
        # Cập nhật trạng thái
        result = @repository.update_status(id, attributes[:status], user_id)
        
        # Nếu cập nhật thành công và chuyển sang trạng thái "completed"
        if result[:success] && attributes[:status] == "completed" && old_status != "completed"
          # Đồng bộ với hệ thống thu hoạch của nông dân
          sync_result = create_farmer_harvest(result[:harvest])
          
          if sync_result[:success]
            result[:message] = "#{result[:message]} - Đã đồng bộ với hệ thống thu hoạch"
          end
        end

        # Cập nhật sản lượng mùa vụ nếu có thay đổi số lượng thực tế
        if result[:success] && attributes[:actual_quantity].present? && 
           attributes[:actual_quantity] != old_actual_quantity
          update_crop_yield(result[:harvest], attributes[:actual_quantity] - (old_actual_quantity || 0))
        end
        
        result
      end
      
      private
      
      def create_farmer_harvest(marketplace_harvest)
        return { success: false, errors: ["Không tìm thấy thông tin mùa vụ"] } unless marketplace_harvest.product_listing&.crop_animal_id

        # Tạo bản ghi thu hoạch trong hệ thống nông nghiệp
        harvest_entity = Entities::Farming::Harvest.new(
          user_id: marketplace_harvest.product_listing.user_id,
          crop_id: marketplace_harvest.product_listing.crop_animal_id,
          quantity: marketplace_harvest.actual_quantity || marketplace_harvest.estimated_quantity,
          harvest_date: Time.current,
          field_id: marketplace_harvest.product_listing.field_id,
          notes: "Thu hoạch marketplace - #{marketplace_harvest.product_listing.title}"
        )

        result = @harvest_repository.create(harvest_entity)
        
        if result
          { success: true, harvest: result }
        else
          { success: false, errors: ["Không thể tạo bản ghi thu hoạch"] }
        end
      end

      def update_crop_yield(marketplace_harvest, quantity)
        return unless marketplace_harvest.product_listing&.crop_animal_id

        # Tìm pineapple crop và cập nhật sản lượng thực tế
        pineapple_crop = ::Models::Farming::PineappleCrop.find_by(id: marketplace_harvest.product_listing.crop_animal_id)
        return unless pineapple_crop

        # Cập nhật sản lượng thực tế
        current_yield = pineapple_crop.actual_yield || 0
        pineapple_crop.update(actual_yield: current_yield + quantity)

        Rails.logger.info "Updated crop yield: #{pineapple_crop.title} - Added #{quantity}kg, Total: #{pineapple_crop.actual_yield}kg"
      end
    end
  end
end