module UseCases::SupplyChain
  module SupplyOrders
    class CreateFarmerOrder
      def initialize(repository, listing_repository)
        @repository = repository
        @listing_repository = listing_repository
      end

      def execute(user_id, params)
        # Lấy thông tin supply listing
        listing_result = @listing_repository.find(params[:supply_listing_id])
        return { success: false, errors: listing_result[:errors] } unless listing_result[:success]

        # Tạo entity cho đơn hàng
        entity = Entities::SupplyChain::SupplyOrder.new(
          user_id: user_id,
          supply_listing_id: params[:supply_listing_id],
          quantity: params[:quantity],
          note: params[:note],
          price: params[:price],
          delivery_province: params[:delivery_province],
          delivery_district: params[:delivery_district],
          delivery_ward: params[:delivery_ward],
          delivery_address: params[:delivery_address],
          contact_phone: params[:contact_phone],
          payment_method: params[:payment_method] || "cod"
        )

        # Validate entity
        validation_errors = entity.validate
        return { success: false, errors: validation_errors } if validation_errors.any?

        # Create order
        result = @repository.create(entity, listing_result[:listing])

        if result[:success]
          order_dto = Dtos::SupplyChain::SupplyOrderDto.new(result[:order])
          { success: true, data: order_dto, message: result[:message] }
        else
          { success: false, errors: result[:errors] }
        end
      end
    end
  end
end
