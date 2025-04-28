module Api
  module V1
    class CropAnimalsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_crop_animal, only: [:show, :update, :destroy]
      
      # GET /api/v1/crop_animals
      def index
        @crop_animals = current_user.crop_animals
        
        # Filter by crop_type if provided
        @crop_animals = @crop_animals.where(crop_type: params[:crop_type]) if params[:crop_type].present?
        
        # Filter by status if provided
        @crop_animals = @crop_animals.where(status: params[:status]) if params[:status].present?
        
        # Sort by created_at by default, or by specified parameter
        sort_by = params[:sort_by] || 'created_at'
        sort_direction = params[:sort_direction] || 'desc'
        @crop_animals = @crop_animals.order("#{sort_by} #{sort_direction}")
        
        # Pagination
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 10).to_i
        total_items = @crop_animals.count
        @crop_animals = @crop_animals.offset((page - 1) * per_page).limit(per_page)
        
        render json: {
          crop_animals: @crop_animals.as_json(
            except: [:created_at, :updated_at],
            methods: [:crop_type_text, :status_text]
          ),
          pagination: {
            page: page,
            per_page: per_page,
            total_items: total_items,
            total_pages: (total_items.to_f / per_page).ceil
          }
        }
      end
      
      # GET /api/v1/crop_animals/:id
      def show
        render json: {
          crop_animal: @crop_animal.as_json(
            except: [:created_at, :updated_at],
            methods: [:crop_type_text, :status_text],
            include: {
              product_listings: { only: [:id, :title, :status] }
            }
          )
        }
      end
      
      # POST /api/v1/crop_animals
      def create
        @crop_animal = current_user.crop_animals.build(crop_animal_params)
        
        if @crop_animal.save
          render json: {
            message: "Đã tạo #{@crop_animal.crop_type == 'crop' ? 'cây trồng' : 'vật nuôi'} thành công",
            crop_animal: @crop_animal.as_json(
              except: [:created_at, :updated_at],
              methods: [:crop_type_text, :status_text]
            )
          }, status: :created
        else
          render json: { errors: @crop_animal.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PUT/PATCH /api/v1/crop_animals/:id
      def update
        if @crop_animal.update(crop_animal_params)
          render json: {
            message: "Đã cập nhật #{@crop_animal.crop_type == 'crop' ? 'cây trồng' : 'vật nuôi'} thành công",
            crop_animal: @crop_animal.as_json(
              except: [:created_at, :updated_at],
              methods: [:crop_type_text, :status_text]
            )
          }
        else
          render json: { errors: @crop_animal.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/crop_animals/:id
      def destroy
        if @crop_animal.product_listings.exists?
          render json: { 
            error: "Không thể xóa vì đã có sản phẩm liên kết. Vui lòng xóa sản phẩm trước." 
          }, status: :unprocessable_entity
        elsif @crop_animal.destroy
          render json: { message: "Đã xóa thành công" }
        else
          render json: { errors: @crop_animal.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      private
      
      def set_crop_animal
        @crop_animal = current_user.crop_animals.find_by(id: params[:id])
        
        unless @crop_animal
          render json: { error: "Không tìm thấy dữ liệu cây trồng/vật nuôi" }, status: :not_found
        end
      end
      
      def crop_animal_params
        params.require(:crop_animal).permit(
          :name, :crop_type, :status, :planting_date, :harvest_date, 
          :description, :location, :field_area, :quantity, :variety, :source
        )
      end
    end
  end
end
