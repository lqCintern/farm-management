# app/controllers/api/v1/labor/base_controller.rb
module Controllers::Api
  module V1
    module Labor
      class BaseController < Controllers::Api::BaseController
        protected

        def render_success_response(data, status = :ok)
          render json: { success: true, data: data }, status: status
        end

        def render_error_response(errors, status = :unprocessable_entity)
          errors = [ errors ] if errors.is_a?(String)
          render json: { success: false, errors: errors }, status: status
        end

        def current_household
          @current_household ||= begin
            if current_user&.owned_labor_households&.first
              current_user.owned_labor_households.first
            elsif current_user&.labor_household
              current_user.labor_household
            else
              nil
            end
          end
        end

        def require_household
          unless current_household
            render_error_response("Bạn cần thuộc về một hộ sản xuất để thực hiện thao tác này", :forbidden)
          end
        end

        def require_household_owner
          household_id = params[:farm_household_id] || params[:household_id] || params[:id]
          unless current_user&.owned_labor_households&.exists?(id: household_id)
            render_error_response("Bạn không có quyền quản lý hộ sản xuất này", :forbidden)
          end
        end
      end
    end
  end
end
