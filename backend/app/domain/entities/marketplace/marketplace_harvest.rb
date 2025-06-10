# app/domain/entities/marketplace/marketplace_harvest.rb
module Entities
  module Marketplace
    class MarketplaceHarvest
      attr_reader :id, :scheduled_date, :location, :notes, :estimated_quantity,
                 :actual_quantity, :estimated_price, :final_price, :status,
                 :payment_proof_url, :payment_date, :created_at, :updated_at,
                 :trader_id, :product_listing_id, :product_order_id,
                 :product_listing, :trader_data, :farmer_data

      def initialize(attributes = {})
        @id = attributes[:id]
        @scheduled_date = attributes[:scheduled_date]
        @location = attributes[:location]
        @notes = attributes[:notes]
        @estimated_quantity = attributes[:estimated_quantity]
        @actual_quantity = attributes[:actual_quantity]
        @estimated_price = attributes[:estimated_price]
        @final_price = attributes[:final_price]
        @status = attributes[:status] || :scheduled
        @payment_proof_url = attributes[:payment_proof_url]
        @payment_date = attributes[:payment_date]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @trader_id = attributes[:trader_id]
        @product_listing_id = attributes[:product_listing_id]
        @product_order_id = attributes[:product_order_id]
        @product_listing = attributes[:product_listing]
        @trader_data = attributes[:trader_data]
        @farmer_data = attributes[:farmer_data]
      end

      # Domain logic
      def estimated_total_value
        return nil if estimated_quantity.nil? || estimated_price.nil?
        estimated_quantity * estimated_price
      end

      def final_total_value
        return nil if actual_quantity.nil? || final_price.nil?
        actual_quantity * final_price
      end

      def payment_complete?
        status == 'payment_confirmed' && payment_proof_url.present?
      end
      
      def active?
        !['completed', 'cancelled', 'payment_confirmed'].include?(status)
      end

      def display_status
        status_map = {
          'scheduled' => 'Đã lên lịch',
          'harvesting' => 'Đang thu hoạch',
          'completed' => 'Đã thu hoạch',
          'payment_confirmed' => 'Đã thanh toán',
          'cancelled' => 'Đã hủy'
        }
        
        status_map[status.to_s] || status.to_s.humanize
      end
    end
  end
end
