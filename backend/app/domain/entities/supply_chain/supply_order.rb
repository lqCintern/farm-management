module Entities
  module SupplyChain
    class SupplyOrder
      attr_accessor :id, :user_id, :supply_listing_id, :quantity, :price, :total,
                    :status, :note, :rejection_reason, :delivery_province, :delivery_district,
                    :delivery_ward, :delivery_address, :contact_phone, :payment_method,
                    :is_paid, :created_at, :updated_at, :purchase_date, :supply_id,
                    :supply_listing, :buyer, :supplier, :has_review

      STATUSES = [:pending, :confirmed, :shipped, :delivered, :completed, :cancelled, :rejected]
      PAYMENT_METHODS = [:cod, :bank_transfer, :ewallet]
      
      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
        
        @status ||= 'pending'
        @is_paid ||= false
        @payment_method ||= 'cod'
        @purchase_date ||= Time.current
      end
      
      def validate
        errors = []
        errors << "Số lượng phải lớn hơn 0" if quantity.nil? || quantity <= 0
        errors << "Giá phải lớn hơn 0" if price.nil? || price <= 0
        errors << "Trạng thái không hợp lệ" unless STATUSES.include?(status.to_sym)
        errors << "Phương thức thanh toán không hợp lệ" unless PAYMENT_METHODS.include?(payment_method.to_sym)
        errors << "Địa chỉ giao hàng không được để trống" if delivery_address.blank?
        errors << "Số điện thoại liên hệ không được để trống" if contact_phone.blank?
        errors
      end
      
      def total_amount
        quantity * price if quantity && price
      end
      
      def pending?
        status.to_s == 'pending'
      end
      
      def confirmed?
        status.to_s == 'confirmed'
      end
      
      def shipped?
        status.to_s == 'shipped'
      end
      
      def delivered?
        status.to_s == 'delivered'
      end
      
      def completed?
        status.to_s == 'completed'
      end
      
      def cancelled?
        status.to_s == 'cancelled'
      end
      
      def rejected?
        status.to_s == 'rejected'
      end
    end
  end
end