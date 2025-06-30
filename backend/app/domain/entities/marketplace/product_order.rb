module Entities
  module Marketplace
    class ProductOrder
      attr_reader :id, :product_listing_id, :buyer_id, :quantity, :price,
                  :note, :status, :rejection_reason, :created_at, :updated_at,
                  :product_listing, :buyer, :total_weight

      def initialize(attributes = {})
        @id = attributes[:id]
        @product_listing_id = attributes[:product_listing_id]
        @buyer_id = attributes[:buyer_id]
        @quantity = attributes[:quantity]
        @price = attributes[:price]
        @note = attributes[:note]
        @status = attributes[:status] || :pending
        @rejection_reason = attributes[:rejection_reason]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @product_listing = attributes[:product_listing]
        @buyer = attributes[:buyer]
        @total_weight = attributes[:total_weight]
      end

      # Domain logic
      def total_amount
        price && total_weight ? price * total_weight : 0
      end

      def pending?
        status.to_s == "pending"
      end

      def accepted?
        status.to_s == "accepted"
      end

      def rejected?
        status.to_s == "rejected"
      end

      def completed?
        status.to_s == "completed"
      end

      def active?
        pending? || accepted?
      end

      def display_status
        status_map = {
          "pending" => "Chờ xác nhận",
          "accepted" => "Đã chấp nhận",
          "rejected" => "Đã từ chối",
          "completed" => "Hoàn thành"
        }

        status_map[status.to_s] || status.to_s.humanize
      end
    end
  end
end
