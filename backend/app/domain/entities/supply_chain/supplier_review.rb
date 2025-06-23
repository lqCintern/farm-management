module Entities
  module SupplyChain
    class SupplierReview
      attr_accessor :id, :supply_order_id, :supply_listing_id, :reviewer_id, :supplier_id,
                    :rating, :content, :created_at, :updated_at,
                    :reviewer, :supplier, :supply_listing, :supply_order

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def validate
        errors = []
        errors << "Rating must be between 1 and 5" unless rating.is_a?(Integer) && rating.between?(1, 5)
        errors << "Content is too long (maximum is 1000 characters)" if content && content.length > 1000
        errors
      end
    end
  end
end
