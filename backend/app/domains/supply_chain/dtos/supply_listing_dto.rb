module SupplyChain
  module Dtos
    class SupplyListingDto
      attr_reader :id, :name, :description, :category, :price, :unit, :quantity, 
                 :brand, :manufacturer, :manufacturing_date, :expiry_date,
                 :province, :district, :ward, :address, :status, :view_count,
                 :created_at, :updated_at, :supplier, :images, :similar_listings,
                 :available_quantity, :pending_quantity, :sold_quantity, :order_count

      def initialize(entity, include_details: false)
        @id = entity.id
        @name = entity.name
        @category = entity.category
        @price = entity.price
        @unit = entity.unit
        @quantity = entity.quantity
        @status = entity.status
        @created_at = entity.created_at
        @updated_at = entity.updated_at
        
        # Thông tin về đơn hàng
        @pending_quantity = entity.pending_quantity || 0
        @sold_quantity = entity.sold_quantity || 0
        @order_count = entity.order_count || 0
        @available_quantity = entity.available_quantity
        
        if entity.images&.any?
          @main_image = entity.images.first[:url]
        end
        
        @supplier = {
          id: entity.user_id || (entity.supplier && entity.supplier[:id]),
          name: entity.supplier && entity.supplier[:name]
        }
        
        # Thêm thông tin chi tiết nếu được yêu cầu
        if include_details
          @description = entity.description
          @brand = entity.brand
          @manufacturer = entity.manufacturer
          @manufacturing_date = entity.manufacturing_date
          @expiry_date = entity.expiry_date
          @province = entity.province
          @district = entity.district
          @ward = entity.ward
          @address = entity.address
          @view_count = entity.view_count
          
          if entity.supplier[:phone]
            @supplier[:phone] = entity.supplier[:phone]
            @supplier[:address] = entity.supplier[:address]
            @supplier[:average_rating] = entity.supplier[:average_rating]
          end
          
          @images = entity.images
          @similar_listings = entity.similar_listings&.map { |listing| SupplyListingDto.new(listing) }
        end
      end
      
      def as_json(*)
        result = {
          id: @id,
          name: @name,
          category: @category,
          price: @price,
          unit: @unit, 
          quantity: @quantity,
          status: @status,
          created_at: @created_at,
          updated_at: @updated_at,
          main_image: @main_image,
          supplier: @supplier,
          
          # Thông tin về đơn hàng
          order_count: @order_count,
          pending_quantity: @pending_quantity,
          sold_quantity: @sold_quantity,
          available_quantity: @available_quantity
        }
        
        # Thêm thông tin chi tiết nếu có
        if @description
          result.merge!({
            description: @description,
            brand: @brand,
            manufacturer: @manufacturer,
            manufacturing_date: @manufacturing_date,
            expiry_date: @expiry_date,
            province: @province,
            district: @district,
            ward: @ward,
            address: @address,
            view_count: @view_count,
            images: @images,
            similar_listings: @similar_listings
          })
        end
        
        result
      end
    end
    end
end