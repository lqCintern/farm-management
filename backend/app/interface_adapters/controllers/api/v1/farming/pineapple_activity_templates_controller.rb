module Controllers::Api
  module V1
    module Farming
      class PineappleActivityTemplatesController < BaseController
        def index
          result = Services::CleanArch.farming_list_pineapple_activity_templates.execute(
            current_user.user_id,
            {
              stage: params[:stage],
              activity_type: params[:activity_type],
              is_required: params[:is_required],
              season_specific: params[:season_specific]
            }
          )

          render json: ::Presenters::Farming::PineappleActivityTemplatePresenter.collection_as_json(result[:templates]), status: :ok
        end

        def show
          result = Services::CleanArch.farming_get_pineapple_activity_template.execute(params[:id])

          if result[:success]
            render json: { data: ::Presenters::Farming::PineappleActivityTemplatePresenter.as_json(result[:template]) }, status: :ok
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def create
          result = Services::CleanArch.farming_create_pineapple_activity_template.execute(
            template_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Đã tạo mẫu hoạt động thành công",
              data: ::Presenters::Farming::PineappleActivityTemplatePresenter.as_json(result[:template])
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        def update
          result = Services::CleanArch.farming_update_pineapple_activity_template.execute(
            params[:id],
            template_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Đã cập nhật mẫu hoạt động thành công",
              data: ::Presenters::Farming::PineappleActivityTemplatePresenter.as_json(result[:template])
            }, status: :ok
          else
            render json: { errors: result[:error] || result[:errors] }, status: :unprocessable_entity
          end
        end

        def destroy
          result = Services::CleanArch.farming_delete_pineapple_activity_template.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: { message: "Đã xóa mẫu hoạt động thành công" }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # Áp dụng template cho một vụ dứa cụ thể
        def apply_to_crop
          result = Services::CleanArch.farming_apply_template_to_activities.execute(
            params[:template_id],
            params[:crop_id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Đã áp dụng mẫu hoạt động thành công",
              farm_activity: ::Farming::FarmActivityPresenter.as_json(result[:farm_activity])
            }, status: :created
          else
            render json: { error: result[:error] || result[:errors] }, status: :unprocessable_entity
          end
        end

        # Thêm phương thức mới vào controller
        def validate_materials
          template = ::Models::Farming::PineappleActivityTemplate.find_by(id: params[:template_id])
          return render json: { error: "Không tìm thấy mẫu hoạt động" }, status: :not_found unless template
          
          # Kiểm tra các vật tư cần thiết
          material_status = []
          template.template_activity_materials.includes(:farm_material).each do |template_material|
            farm_material = ::Models::Farming::FarmMaterial.where(user_id: current_user.user_id)
                         .find_by(id: template_material.farm_material_id)
            
            status = {
              material_id: template_material.farm_material_id,
              name: template_material.farm_material.name,
              required_quantity: template_material.quantity,
              unit: template_material.farm_material.unit,
              available: farm_material&.available_quantity || 0,
              sufficient: farm_material && farm_material.available_quantity >= template_material.quantity
            }
            
            material_status << status
          end
          
          render json: { data: material_status }, status: :ok
        end

        private

        # Cập nhật phương thức template_params để cho phép vật tư
        def template_params
          params.require(:template).permit(
            :name, :description, :activity_type, :stage,
            :day_offset, :duration_days, :season_specific, :is_required,
            materials: {}
          )
        end
      end
    end
  end
end
