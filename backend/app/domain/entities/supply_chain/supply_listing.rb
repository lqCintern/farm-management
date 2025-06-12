module Entities
  module SupplyChain
    class SupplyListing
      attr_accessor :id, :name, :description, :category, :price, :unit, :quantity,
                   :brand, :manufacturer, :manufacturing_date, :expiry_date,
                   :province, :district, :ward, :address, :status, :view_count,
                   :created_at, :updated_at, :user_id, :pending_quantity, :sold_quantity,
                   :images, :supplier, :similar_listings, :order_count

      CATEGORIES = [:fertilizer, :pesticide, :seed, :equipment, :other].freeze
      STATUSES = [:draft, :active, :inactive, :sold_out].freeze

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
        
        # Default values
        @status ||= 'draft'
        @pending_quantity ||= 0
        @sold_quantity ||= 0
        @view_count ||= 0
        @order_count ||= 0
        @images ||= []
      end

      def validate
        errors = []
        errors << "Tên vật tư không được để trống" if name.blank?
        errors << "Giá phải lớn hơn 0" if price.nil? || price <= 0
        errors << "Số lượng không được để trống" if quantity.nil?
        errors << "Đơn vị tính không được để trống" if unit.blank?
        errors << "Danh mục không hợp lệ" unless CATEGORIES.include?(category.to_sym)
        errors
      end

      def available_quantity
        quantity - pending_quantity
      end
      
      def category_name
        I18n.t("supply_listing.categories.#{category}", default: category.to_s.humanize)
      end
      
      def status_name
        I18n.t("supply_listing.statuses.#{status}", default: status.to_s.humanize)
      end
    end
  end
end