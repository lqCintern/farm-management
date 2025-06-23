module Dtos
  module SupplyChain
    class SupplierReviewDto
      attr_reader :id, :rating, :content, :created_at,
                  :reviewer, :supplier, :supply_listing, :supply_order

      def initialize(entity, include_details = false)
        @id = entity.id
        @rating = entity.rating
        @content = entity.content
        @created_at = entity.created_at

        # Basic reviewer info
        if entity.reviewer
          @reviewer = {
            id: entity.reviewer[:id] || entity.reviewer_id,
            name: entity.reviewer[:name]
          }
        end

        # Basic supplier info
        if entity.supplier
          @supplier = {
            id: entity.supplier[:id] || entity.supplier_id,
            name: entity.supplier[:name]
          }
        end

        # Basic supply_listing info
        if entity.supply_listing
          @supply_listing = {
            id: entity.supply_listing[:id] || entity.supply_listing_id,
            name: entity.supply_listing[:name]
          }
        end

        # Add order info if details requested
        if include_details && entity.supply_order
          @supply_order = {
            id: entity.supply_order[:id] || entity.supply_order_id,
            status: entity.supply_order[:status]
          }
        end
      end

      def as_json(*)
        result = {
          id: @id,
          rating: @rating,
          content: @content,
          created_at: @created_at
        }

        result[:reviewer] = @reviewer if @reviewer
        result[:supplier] = @supplier if @supplier
        result[:supply_listing] = @supply_listing if @supply_listing
        result[:supply_order] = @supply_order if @supply_order

        result
      end
    end
  end
end
