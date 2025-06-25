module Controllers::Api
  module V1
    module Farming
      class FarmMaterialsController < BaseController
        include PaginationHelper

        def index
          result = Services::CleanArch.farming_list_farm_materials.execute(
            current_user.user_id,
            {
              name: params[:name],
              category: params[:category]
            }
          )

          # Phân trang kết quả
          @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
          materials = records.map { |record| Services::CleanArch.farming_farm_material_repository.send(:map_to_entity, record) }

          render json: ::Presenters::Farming::FarmMaterialPresenter.collection_as_json(materials, @pagy), status: :ok
        end

        def show
          id = params[:id]
          result = Services::CleanArch.farming_farm_material_statistics_service.get_material_details(id, current_user.user_id)
          
          if result[:success]
            render json: {
              status: "success",
              material: result[:material],
              transactions: result[:transactions],
              activities: result[:activities],
              statistics: result[:statistics]
            }
          else
            render json: { status: "error", error: result[:error] }, status: :unprocessable_entity
          end
        end

        def create
          result = Services::CleanArch.farming_create_farm_material.execute(
            material_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Vật tư đã được tạo thành công",
              material: ::Presenters::Farming::FarmMaterialPresenter.as_json(result[:farm_material])
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        def update
          result = Services::CleanArch.farming_update_farm_material.execute(
            params[:id],
            material_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Vật tư đã được cập nhật thành công",
              material: ::Presenters::Farming::FarmMaterialPresenter.as_json(result[:farm_material])
            }, status: :ok
          else
            render json: { errors: result[:error] || result[:errors] }, status: :unprocessable_entity
          end
        end

        def destroy
          result = Services::CleanArch.farming_delete_farm_material.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: { message: "Đã xóa vật tư thành công" }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        def statistics
          # Lấy thống kê vật tư với bộ lọc
          result = Services::CleanArch.farming_farm_material_repository.get_statistics(
            current_user.user_id,
            {
              start_date: params[:start_date],
              end_date: params[:end_date],
              field_id: params[:field_id],
              crop_id: params[:crop_id]
            }
          )
          
          if result[:success]
            render json: { 
              status: "success", 
              statistics: result[:statistics],
              details: result[:details],
              monthly_data: result[:monthly_data]
            }, status: :ok
          else
            render json: { status: "error", message: "Không thể lấy thống kê vật tư" }, status: :unprocessable_entity
          end
        end

        private

        def material_params
          params.require(:material).permit(:name, :material_id, :quantity, :unit, :category)
        end
      end
    end
  end
end
