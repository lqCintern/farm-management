module Api
  module V1
    module Farming
      class PineappleActivityTemplatesController < BaseController
        before_action :set_template, only: [:show, :update, :destroy]

        def index
          # Lấy cả templates mặc định và của user
          templates = PineappleActivityTemplate.default_templates.to_a
          user_templates = current_user.pineapple_activity_templates.to_a

          all_templates = templates + user_templates

          # Lọc theo các tiêu chí nếu cần
          if params[:stage].present?
            all_templates.select! { |t| t.stage.to_s == params[:stage] }
          end

          if params[:activity_type].present?
            all_templates.select! { |t| t.activity_type.to_s == params[:activity_type] }
          end

          render json: { data: all_templates }, status: :ok
        end

        def show
          render json: { data: @template }, status: :ok
        end

        def create
          template = current_user.pineapple_activity_templates.new(template_params)

          if template.save
            render json: {
              message: "Đã tạo mẫu hoạt động thành công",
              data: template
            }, status: :created
          else
            render json: { errors: template.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          # Chỉ cho phép sửa templates của user này
          unless @template.user_id == current_user.id
            return render json: { error: "Không có quyền sửa mẫu này" }, status: :forbidden
          end

          if @template.update(template_params)
            render json: {
              message: "Đã cập nhật mẫu hoạt động thành công",
              data: @template
            }, status: :ok
          else
            render json: { errors: @template.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          # Chỉ cho phép xóa templates của user này
          unless @template.user_id == current_user.id
            return render json: { error: "Không có quyền xóa mẫu này" }, status: :forbidden
          end

          @template.destroy
          render json: { message: "Đã xóa mẫu hoạt động thành công" }, status: :ok
        end

        # Áp dụng template cho một vụ dứa cụ thể
        def apply_to_crop
          template = PineappleActivityTemplate.find(params[:template_id])
          crop = current_user.pineapple_crops.find(params[:crop_id])

          service = PineappleCropService.new(crop, current_user)

          if service.send(:create_activity_from_template, template, crop.current_stage)
            render json: {
              message: "Đã áp dụng mẫu hoạt động thành công"
            }, status: :created
          else
            render json: { error: "Không thể áp dụng mẫu hoạt động" }, status: :unprocessable_entity
          end
        end

        private

        def set_template
          @template = PineappleActivityTemplate.find_by(id: params[:id])
          render json: { error: "Không tìm thấy mẫu hoạt động" }, status: :not_found unless @template
        end

        def template_params
          params.require(:template).permit(
            :name, :description, :activity_type, :stage,
            :day_offset, :duration_days, :season_specific, :is_required
          )
        end
      end
    end
  end
end
