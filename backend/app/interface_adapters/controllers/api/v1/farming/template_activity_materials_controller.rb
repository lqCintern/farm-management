module Controllers::Api
  module V1
    module Farming
      class TemplateActivityMaterialsController < BaseController
        before_action :set_template, only: [:index, :create, :show, :update, :destroy, :statistics, :feasibility, :inventory_comparison, :batch_create]
        before_action :initialize_service

        def initialize_service
          @template_material_service = ::Services::Farming::TemplateMaterialService.new(@template)
        end

        # GET /api/v1/farming/pineapple_activity_templates/:template_id/materials
        def index
          materials = @template.template_activity_materials.includes(:farm_material)
          
          render json: {
            success: true,
            data: ::Formatters::Farming::TemplateActivityMaterialFormatter.format_collection_response(materials)
          }, status: :ok
        end

        # POST /api/v1/farming/pineapple_activity_templates/:template_id/materials
        def create
          # Kiểm tra quyền chỉnh sửa template
          unless can_edit_template?(@template)
            render json: { error: "Không có quyền chỉnh sửa template này" }, status: :forbidden
            return
          end

          # Format input params
          create_params = ::Formatters::Farming::TemplateActivityMaterialFormatter.format_create_params(template_material_params)

          farm_material = Models::Farming::FarmMaterial.where(user_id: current_user.user_id)
                                                      .find_by(id: create_params[:material_id])
          
          unless farm_material
            render json: { error: "Không tìm thấy vật tư" }, status: :not_found
            return
          end

          # Kiểm tra vật tư đã tồn tại trong template chưa
          existing_material = @template.template_activity_materials
                                      .find_by(farm_material_id: create_params[:material_id])
          
          if existing_material
            render json: { error: "Vật tư đã có trong template" }, status: :unprocessable_entity
            return
          end

          template_material = @template.template_activity_materials.build(
            farm_material: farm_material,
            quantity: create_params[:quantity]
          )

          if template_material.save
            result = { success: true, template_material: template_material }
            response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_create_response(result)
            render json: response_data, status: :created
          else
            result = { success: false, errors: template_material.errors.full_messages }
            response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_create_response(result)
            render json: response_data, status: :unprocessable_entity
          end
        end

        # GET /api/v1/farming/pineapple_activity_templates/:template_id/materials/:id
        def show
          template_material = @template.template_activity_materials
                                      .includes(:farm_material)
                                      .find_by(id: params[:id])
          
          unless template_material
            render json: { error: "Không tìm thấy vật tư trong template" }, status: :not_found
            return
          end

          render json: {
            success: true,
            data: ::Formatters::Farming::TemplateActivityMaterialFormatter.format_template_material_response(template_material)
          }, status: :ok
        end

        # PUT /api/v1/farming/pineapple_activity_templates/:template_id/materials/:id
        def update
          # Kiểm tra quyền chỉnh sửa template
          unless can_edit_template?(@template)
            render json: { error: "Không có quyền chỉnh sửa template này" }, status: :forbidden
            return
          end

          # Format input params
          update_params = ::Formatters::Farming::TemplateActivityMaterialFormatter.format_update_params(template_material_params)

          template_material = @template.template_activity_materials.find_by(id: params[:id])
          
          unless template_material
            render json: { error: "Không tìm thấy vật tư trong template" }, status: :not_found
            return
          end

          if template_material.update(quantity: update_params[:quantity])
            result = { success: true, template_material: template_material }
            response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_update_response(result)
            render json: response_data, status: :ok
          else
            result = { success: false, errors: template_material.errors.full_messages }
            response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_update_response(result)
            render json: response_data, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/farming/pineapple_activity_templates/:template_id/materials/:id
        def destroy
          # Kiểm tra quyền chỉnh sửa template
          unless can_edit_template?(@template)
            render json: { error: "Không có quyền chỉnh sửa template này" }, status: :forbidden
            return
          end

          template_material = @template.template_activity_materials.find_by(id: params[:id])
          
          unless template_material
            render json: { error: "Không tìm thấy vật tư trong template" }, status: :not_found
            return
          end

          if template_material.destroy
            render json: {
              success: true,
              message: "Đã xóa vật tư khỏi template"
            }, status: :ok
          else
            render json: { 
              error: "Không thể xóa vật tư",
              errors: template_material.errors.full_messages 
            }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_activity_templates/:template_id/materials/batch
        def batch_create
          # Kiểm tra quyền chỉnh sửa template
          unless can_edit_template?(@template)
            render json: { error: "Không có quyền chỉnh sửa template này" }, status: :forbidden
            return
          end

          # Format batch params
          materials_data = ::Formatters::Farming::TemplateActivityMaterialFormatter.format_batch_create_params(batch_materials_params)
          
          unless materials_data.is_a?(Array) && materials_data.any?
            render json: { error: "Dữ liệu materials phải là array và không được rỗng" }, status: :bad_request
            return
          end

          success_count = 0
          errors = []
          created_materials = []

          ActiveRecord::Base.transaction do
            materials_data.each do |material_data|
              farm_material = Models::Farming::FarmMaterial.where(user_id: current_user.user_id)
                                                        .find_by(id: material_data[:material_id])
              
              unless farm_material
                errors << "Không tìm thấy vật tư ID: #{material_data[:material_id]}"
                next
              end

              # Kiểm tra vật tư đã tồn tại trong template chưa
              existing_material = @template.template_activity_materials
                                          .find_by(farm_material_id: material_data[:material_id])
              
              if existing_material
                errors << "Vật tư #{farm_material.name} đã có trong template"
                next
              end

              template_material = @template.template_activity_materials.build(
                farm_material: farm_material,
                quantity: material_data[:quantity]
              )

              if template_material.save
                success_count += 1
                created_materials << template_material
              else
                errors << "Không thể thêm vật tư #{farm_material.name}: #{template_material.errors.full_messages.join(', ')}"
              end
            end
          end

          result = {
            success: success_count > 0,
            success_count: success_count,
            template_materials: created_materials,
            errors: errors
          }

          response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_batch_create_response(result)
          
          if result[:success]
            render json: response_data, status: :created
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        # GET /api/v1/farming/pineapple_activity_templates/:template_id/materials/statistics
        def statistics
          stats = @template_material_service.get_materials_statistics(current_user.user_id)
          
          result = { success: true, statistics: stats }
          response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_statistics_response(result)
          render json: response_data, status: :ok
        end

        # GET /api/v1/farming/pineapple_activity_templates/:template_id/materials/feasibility
        def feasibility
          feasibility_result = @template_material_service.check_feasibility(current_user.user_id)
          
          result = { success: true, feasibility: feasibility_result }
          response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_feasibility_response(result)
          render json: response_data, status: :ok
        end

        # GET /api/v1/farming/pineapple_activity_templates/:template_id/materials/inventory_comparison
        def inventory_comparison
          comparison = @template_material_service.compare_with_inventory(current_user.user_id)
          
          result = { success: true, comparison: comparison }
          response_data = ::Presenters::Farming::TemplateActivityMaterialPresenter.format_inventory_comparison_response(result)
          render json: response_data, status: :ok
        end

        private

        def set_template
          @template = Models::Farming::PineappleActivityTemplate.find_by(id: params[:pineapple_activity_template_id])
          
          unless @template
            render json: { error: "Không tìm thấy template" }, status: :not_found
            return
          end
        end

        def can_edit_template?(template)
          # Chỉ user tạo template mới có quyền chỉnh sửa
          template.user_id.nil? || template.user_id == current_user.user_id
        end

        def template_material_params
          # Handle both parameter names that frontend might send
          if params[:template_material].present?
            params.require(:template_material).permit(:material_id, :quantity)
          else
            params.require(:material).permit(:material_id, :quantity)
          end
        end

        def batch_materials_params
          params.require(:batch).permit(materials: [:material_id, :quantity])
        end
      end
    end
  end
end 