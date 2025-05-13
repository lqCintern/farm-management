module Api
  module V1
    module Farming
      class FarmMaterialsController < BaseController
        include PaginationHelper
        load_and_authorize_resource

        def index
          @pagy, materials = pagy(current_user.farm_materials, items: 10)
          render json: {
            materials: FarmMaterialSerializer.new(materials).serializable_hash,
            pagination: pagy_metadata(@pagy)
          }, status: :ok
        end

        def create
          material = current_user.farm_materials.new(material_params)
          if material.save
            render json: FarmMaterialSerializer.new(material).serializable_hash, status: :created
          else
            render json: { errors: material.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def show
          render json: FarmMaterialSerializer.new(@material).serializable_hash, status: :ok
        end

        def update
          if @material.update(material_params)
            render json: FarmMaterialSerializer.new(@material).serializable_hash, status: :ok
          else
            render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @material.destroy
          render json: { message: "Material deleted successfully" }, status: :ok
        end

        private

        def material_params
          params.require(:material).permit(:name, :material_id, :quantity, :last_updated)
        end
      end
    end
  end
end
