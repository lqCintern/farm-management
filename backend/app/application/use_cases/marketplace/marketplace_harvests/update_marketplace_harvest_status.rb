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
        
        result
      end
      
      private
      
      def create_farmer_harvest(marketplace_harvest)
        # Kiểm tra xem đã có harvest tương ứng chưa
        if Models::Farming::Harvest.exists?(marketplace_harvest_id: marketplace_harvest.id)
          return { success: true, message: "Đã có thu hoạch tương ứng" }
        end
        
        # Lấy thông tin product listing
        product = Models::Marketplace::ProductListing.find_by(id: marketplace_harvest.product_listing_id)
        return { success: false, errors: ["Không tìm thấy thông tin sản phẩm"] } unless product
        
        # Tìm thông tin ruộng và cây trồng nếu có
        field_id = nil
        if product.respond_to?(:crop_animal_id) && product.crop_animal_id.present? && 
           product.respond_to?(:crop_animal_type) && product.crop_animal_type == "PineappleCrop"
          crop = Models::PineappleCrop.find_by(id: product.crop_animal_id)
          field_id = crop&.field_id
        end
        
        # Tạo bản ghi harvest mới
        harvest = Models::Farming::Harvest.create(
          user_id: product.user_id,
          crop_id: product.respond_to?(:crop_animal_id) ? product.crop_animal_id : nil, 
          field_id: field_id,
          quantity: marketplace_harvest.actual_quantity || marketplace_harvest.estimated_quantity,
          harvest_date: marketplace_harvest.scheduled_date || Time.current,
          notes: "Thu hoạch bán cho thương lái #{marketplace_harvest.trader&.fullname || marketplace_harvest.trader_id}",
          marketplace_harvest_id: marketplace_harvest.id,
          is_marketplace_sale: true,
          sale_price: marketplace_harvest.final_price || marketplace_harvest.estimated_price
        )
        
        if harvest.persisted?
          { success: true, harvest: harvest, message: "Tạo thu hoạch thành công" }
        else
          { success: false, errors: harvest.errors.full_messages }
        end
      end
    end
  end
end