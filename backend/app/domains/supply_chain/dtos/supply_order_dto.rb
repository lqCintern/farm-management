module SupplyChain
  module Dtos
    class SupplyOrderDto
      attr_reader :id, :status, :quantity, :price, :total, :created_at, :purchase_date,
                  :supply_listing, :supplier, :buyer, :note, :rejection_reason,
                  :delivery_province, :delivery_district, :delivery_ward,
                  :delivery_address, :contact_phone, :payment_method,
                  :is_paid, :has_review
      
      def initialize(entity, detailed = false, current_user_id = nil)
        @id = entity.id
        @status = entity.status
        @quantity = entity.quantity
        @price = entity.price
        @total = entity.total_amount
        @created_at = entity.created_at
        @purchase_date = entity.purchase_date
        
        # Cấu trúc cơ bản cho supply_listing
        @supply_listing = {
          id: entity.supply_listing&.dig(:id),
          name: entity.supply_listing&.dig(:name),
          image: entity.supply_listing&.dig(:images)&.first&.dig(:url)
        }
        
        # Thông tin nhà cung cấp
        @supplier = {
          id: entity.supplier&.dig(:id),
          name: entity.supplier&.dig(:name),
          phone: entity.supplier&.dig(:phone)
        }
        
        # Thông tin người mua
        @buyer = {
          id: entity.buyer&.dig(:id),
          name: entity.buyer&.dig(:name),
          phone: detailed ? entity.buyer&.dig(:phone) : nil
        }
        
        # Thêm thông tin chi tiết nếu được yêu cầu
        if detailed
          @note = entity.note
          @rejection_reason = entity.rejection_reason
          @delivery_province = entity.delivery_province
          @delivery_district = entity.delivery_district
          @delivery_ward = entity.delivery_ward
          @delivery_address = entity.delivery_address
          @contact_phone = entity.contact_phone
          @payment_method = entity.payment_method
          @is_paid = entity.is_paid
          @has_review = entity.has_review
          
          # Bổ sung thông tin chi tiết cho supply_listing
          if entity.supply_listing
            @supply_listing.merge!({
              category: entity.supply_listing[:category],
              unit: entity.supply_listing[:unit],
              brand: entity.supply_listing[:brand],
              manufacturer: entity.supply_listing[:manufacturer]
            })
          end
        end
      end
      
      def as_json(*)
        result = {
          id: @id,
          status: @status,
          quantity: @quantity,
          price: @price,
          total: @total,
          created_at: @created_at,
          purchase_date: @purchase_date,
          supply_listing: @supply_listing,
          supplier: @supplier
        }
        
        result[:buyer] = @buyer if @buyer && @buyer[:id]
        
        if @note
          result.merge!({
            note: @note,
            rejection_reason: @rejection_reason,
            delivery_province: @delivery_province,
            delivery_district: @delivery_district,
            delivery_ward: @delivery_ward,
            delivery_address: @delivery_address,
            contact_phone: @contact_phone,
            payment_method: @payment_method,
            is_paid: @is_paid,
            has_review: @has_review
          })
        end
        
        result
      end
    end
    end
end