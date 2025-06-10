module Entities
  module Marketplace
    class ProductListing
      attr_reader :id, :title, :description, :product_type, :quantity, :average_size,
                  :price_expectation, :status, :province, :district, :ward, :address,
                  :latitude, :longitude, :user_id, :crop_animal_id, :harvest_start_date,
                  :harvest_end_date, :view_count, :message_count, :order_count,
                  :location_note, :total_weight, :created_at, :updated_at, :product_images,
                  :seller_name, :user_name, :seller_rating, :pineapple_crop_data

      def initialize(attributes = {})
        @id = attributes[:id]
        @title = attributes[:title]
        @description = attributes[:description]
        @product_type = attributes[:product_type]
        @quantity = attributes[:quantity]
        @average_size = attributes[:average_size]
        @price_expectation = attributes[:price_expectation]
        @status = attributes[:status]
        @province = attributes[:province]
        @district = attributes[:district]
        @ward = attributes[:ward]
        @address = attributes[:address]
        @latitude = attributes[:latitude]
        @longitude = attributes[:longitude]
        @user_id = attributes[:user_id]
        @crop_animal_id = attributes[:crop_animal_id]
        @harvest_start_date = attributes[:harvest_start_date]
        @harvest_end_date = attributes[:harvest_end_date]
        @view_count = attributes[:view_count] || 0
        @message_count = attributes[:message_count] || 0
        @order_count = attributes[:order_count] || 0
        @location_note = attributes[:location_note]
        @total_weight = attributes[:total_weight]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @product_images = attributes[:product_images] || []
        @seller_name = attributes[:seller_name]
        @user_name = attributes[:user_name]
        @seller_rating = attributes[:seller_rating]
        @pineapple_crop_data = attributes[:pineapple_crop_data]
      end

      # Domain logic - giữ ở đây
      def draft?
        @status == :draft || @status == "draft"
      end

      def active?
        @status == :active || @status == "active"
      end

      def sold?
        @status == :sold || @status == "sold"
      end

      def hidden?
        @status == :hidden || @status == "hidden"
      end

      def estimate_total_weight
        return @total_weight if @total_weight.present?
        return nil if @quantity.nil? || @average_size.nil?

        (@quantity * @average_size) / 1000.0  # Chuyển đổi từ gram sang kg
      end

      def location_text
        [ @address, @ward, @district, @province ].compact.join(", ")
      end

      def google_maps_url
        return nil unless @latitude.present? && @longitude.present?
        "https://www.google.com/maps?q=#{@latitude},#{@longitude}"
      end

      def main_image_url
        @product_images.first&.image_url if @product_images.any?
      end

      def valid_harvest_dates?
        return true if @harvest_start_date.nil? || @harvest_end_date.nil?
        @harvest_end_date >= @harvest_start_date
      end

      # Phương thức để tạo dữ liệu API response mà không phụ thuộc vào controller
      def as_json
        {
          product_listing: {
            id: @id,
            title: @title,
            description: @description,
            product_type: @product_type,
            quantity: @quantity,
            average_size: @average_size,
            price_expectation: @price_expectation,
            status: @status,
            province: @province,
            district: @district,
            ward: @ward,
            address: @address,
            latitude: @latitude,
            longitude: @longitude,
            harvest_start_date: @harvest_start_date,
            harvest_end_date: @harvest_end_date,
            view_count: @view_count,
            message_count: @message_count,
            order_count: @order_count,
            location_text: location_text,
            estimated_weight: estimate_total_weight,
            google_maps_url: google_maps_url,
            created_at: @created_at,
            updated_at: @updated_at,
            pineapple_crop: @pineapple_crop_data
          },

          seller: {
            id: @user_id,
            name: @seller_name || @user_name,
            rating: @seller_rating
          },

          product_images: @product_images.map(&:image_url)
        }
      end
    end
  end
end
