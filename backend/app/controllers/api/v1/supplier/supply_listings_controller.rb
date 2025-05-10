module Api
  module V1
    module Supplier
      class SupplyListingsController < ApplicationController
        before_action :authenticate_user!
        before_action :ensure_supplier
        before_action :set_supply_listing, only: [:show, :update, :destroy]
        
        # GET /api/v1/supplier/supply_listings
        def index
          @supply_listings = current_user.supply_listings
                                        .includes(supply_images: { image_attachment: :blob })
                                        .order(created_at: :desc)
          
          render json: {
            status: 'success',
            data: @supply_listings.map { |listing| supply_listing_json(listing) }
          }
        end
        
        # GET /api/v1/supplier/supply_listings/:id
        def show
          render json: {
            status: 'success',
            data: supply_listing_json(@supply_listing, true)
          }
        end
        
        # POST /api/v1/supplier/supply_listings
        def create
          @supply_listing = current_user.supply_listings.build(supply_listing_params)
          @supply_listing.last_updated = Time.current
          
          if @supply_listing.save
            # Xử lý hình ảnh nếu có
            process_images
            
            render json: {
              status: 'success',
              message: 'Đăng vật tư thành công',
              data: supply_listing_json(@supply_listing)
            }, status: :created
          else
            render json: {
              status: 'error',
              message: 'Không thể đăng vật tư',
              errors: @supply_listing.errors
            }, status: :unprocessable_entity
          end
        end
        
        # PATCH/PUT /api/v1/supplier/supply_listings/:id
        def update
          @supply_listing.last_updated = Time.current
          
          if @supply_listing.update(supply_listing_params)
            # Xử lý hình ảnh nếu có
            process_images if params[:images].present?
            
            render json: {
              status: 'success',
              message: 'Cập nhật vật tư thành công',
              data: supply_listing_json(@supply_listing)
            }
          else
            render json: {
              status: 'error',
              message: 'Không thể cập nhật vật tư',
              errors: @supply_listing.errors
            }, status: :unprocessable_entity
          end
        end
        
        # DELETE /api/v1/supplier/supply_listings/:id
        def destroy
          if @supply_listing.destroy
            render json: {
              status: 'success',
              message: 'Xóa vật tư thành công'
            }
          else
            render json: {
              status: 'error',
              message: 'Không thể xóa vật tư'
            }, status: :unprocessable_entity
          end
        end
        
        # PUT /api/v1/supplier/supply_listings/:id/change_status
        def change_status
          @supply_listing = current_user.supply_listings.find(params[:id])
          
          if @supply_listing.update(status: params[:status])
            render json: {
              status: 'success',
              message: 'Cập nhật trạng thái thành công',
              data: { status: @supply_listing.status }
            }
          else
            render json: {
              status: 'error',
              message: 'Không thể cập nhật trạng thái'
            }, status: :unprocessable_entity
          end
        end
        
        private
        
        def set_supply_listing
          @supply_listing = current_user.supply_listings.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: {
            status: 'error',
            message: 'Không tìm thấy vật tư'
          }, status: :not_found
        end
        
        def supply_listing_params
          params.require(:supply_listing).permit(
            :name, :category, :price, :unit, :quantity, 
            :description, :status, :brand, :manufacturer,
            :manufacturing_date, :expiry_date,
            :province, :district, :ward, :address
          )
        end
        
        def process_images
          return unless params[:images].present?
          
          # Xóa ảnh cũ nếu có yêu cầu
          if params[:delete_all_images].present? && params[:delete_all_images] == "true"
            @supply_listing.supply_images.destroy_all
          end
          
          # Thêm ảnh mới
          params[:images].each_with_index do |image, index|
            position = @supply_listing.supply_images.count + index
            @supply_listing.supply_images.create(position: position, image: image)
          end
        end
        
        def supply_listing_json(listing, detailed = false)
          json = {
            id: listing.id,
            name: listing.name,
            category: listing.category,
            price: listing.price,
            unit: listing.unit,
            quantity: listing.quantity,
            status: listing.status,
            created_at: listing.created_at,
            updated_at: listing.updated_at,
            view_count: listing.view_count,
            order_count: listing.order_count,
            main_image: listing.supply_images.sorted.first&.image_url
          }
          
          if detailed
            json.merge!({
              description: listing.description,
              brand: listing.brand,
              manufacturer: listing.manufacturer,
              manufacturing_date: listing.manufacturing_date,
              expiry_date: listing.expiry_date,
              province: listing.province,
              district: listing.district,
              ward: listing.ward,
              address: listing.address,
              supplier: {
                id: listing.user.user_id,
                name: listing.user.user_name,
                phone: listing.user.phone
              },
              images: listing.supply_images.sorted.map do |img|
                {
                  id: img.id,
                  url: img.image_url,
                  position: img.position
                }
              end
            })
          end
          
          json
        end
        
        def ensure_supplier
          unless current_user.supplier?
            render json: {
              status: 'error',
              message: 'Bạn không có quyền truy cập chức năng này'
            }, status: :forbidden
          end
        end
      end
    end
  end
end
