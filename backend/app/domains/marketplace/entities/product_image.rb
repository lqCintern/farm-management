module Marketplace
  module Entities
    class ProductImage
      attr_reader :id, :image_url, :position

      def initialize(attributes = {})
        @id = attributes[:id]
        @image_url = attributes[:image_url]
        @position = attributes[:position]
      end
    end
    end
end