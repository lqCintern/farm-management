
  module Marketplace
    class ProductListingFormatter
      # Format params cho create action
      def self.format_create_params(params, current_user_id)
        {
          # Thông tin cơ bản về sản phẩm
          basic_attributes: {
            title: params[:title],
            description: params[:description],
            status: params[:status],
            product_type: params[:product_type],
            quantity: params[:quantity],
            total_weight: params[:total_weight],
            average_size: params[:average_size],
            price_expectation: params[:price_expectation],
            province: params[:province],
            district: params[:district],
            ward: params[:ward],
            address: params[:address],
            latitude: params[:latitude],
            longitude: params[:longitude],
            harvest_start_date: params[:harvest_start_date],
            harvest_end_date: params[:harvest_end_date],
            crop_animal_id: params[:crop_animal_id],
            location_note: params[:location_note]
          }.compact,
          
          # Thông tin user
          user_id: current_user_id,
          
          # Formatted images sẽ được truyền riêng
        }
      end

      # Format params cho update action  
      def self.format_update_params(params, current_user_id)
        {
          # Thông tin cơ bản về sản phẩm
          basic_attributes: {
            title: params[:title], 
            description: params[:description],
            status: params[:status],
            product_type: params[:product_type],
            quantity: params[:quantity],
            total_weight: params[:total_weight],
            average_size: params[:average_size],
            price_expectation: params[:price_expectation],
            province: params[:province],
            district: params[:district],
            ward: params[:ward],
            address: params[:address],
            latitude: params[:latitude], 
            longitude: params[:longitude],
            harvest_start_date: params[:harvest_start_date],
            harvest_end_date: params[:harvest_end_date],
            crop_animal_id: params[:crop_animal_id],
            location_note: params[:location_note]
          }.compact,
          
          # Thông tin user
          user_id: current_user_id,
          
          # Formatted images sẽ được truyền riêng
        }
      end

      # Format hình ảnh từ request params
      def self.format_images(images_params)
        return [] unless images_params.present?
        
        images_params.each_with_index.map do |img, idx|
          { image: img, position: idx + 1 }
        end
      end
      
      # Format hình ảnh có kèm ID (cho update)
      def self.format_images_with_ids(images_params)
        return [] unless images_params.present?
        
        images_params.each_with_index.map do |img, idx|
          if img.is_a?(Hash) && img[:id].present?
            { id: img[:id], position: idx + 1 }
          elsif img.is_a?(Hash) && img[:image].present?
            { image: img[:image], position: idx + 1 }
          else
            { image: img, position: idx + 1 }
          end
        end
      end

      # Format filter params từ request
      def self.format_filter_params(params)
        {
          product_type: params[:product_type],
          province: params[:province],
          min_price: params[:min_price],
          max_price: params[:max_price],
          ready_to_harvest: params[:ready_to_harvest],
          sort: params[:sort],
          page: params[:page],
          per_page: params[:per_page] || 12
        }
      end

      # Format my_listings params
      def self.format_my_listings_params(params, user_id)
        {
          user_id: user_id,
          status: params[:status],
          page: params[:page] || 1,
          per_page: params[:per_page] || 10
        }
      end

      # Format response cho update action
      def self.format_update_response(result)
        {
          message: result[:message],
          product_listing: {
            id: result[:product_listing].id,
            title: result[:product_listing].title,
            status: result[:product_listing].status
          }
        }
      end

      # Format response cho status update actions
      def self.format_status_update_response(result)
        {
          message: result[:message],
          product_listing: {
            id: result[:product_listing].id,
            status: result[:product_listing].status
          }
        }
      end
    end
  end
