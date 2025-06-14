module SupplyChain
  module Entities
    class SupplyImage
      attr_accessor :id, :supply_listing_id, :image_url, :position, :created_at, :updated_at
      
      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end
      
      def validate
        errors = []
        errors << "URL hình ảnh không được để trống" if image_url.blank?
        errors << "Vị trí không được để trống" if position.nil?
        errors
      end
    end
    end
end