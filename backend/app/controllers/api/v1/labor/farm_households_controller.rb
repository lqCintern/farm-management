# app/controllers/api/v1/labor/farm_households_controller.rb
module Api
  module V1
    module Labor
      class FarmHouseholdsController < BaseController
        before_action :set_household_id, only: [:show, :update, :destroy]
        before_action :require_household_owner, only: [:update, :destroy]

        def index
          households = CleanArch.labor_list_farm_households.execute
          render_success_response(households)
        end

        def show
          summary = CleanArch.labor_get_household_summary.execute(params[:id])
          
          if summary
            render_success_response(summary)
          else
            render_error_response(["Không tìm thấy hộ sản xuất"], :not_found)
          end
        end

        def create
          result = CleanArch.labor_create_farm_household.execute(current_user, household_params.to_h)

          if result[:success]
            render_success_response(result[:household], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def update
          result = CleanArch.labor_update_farm_household.execute(params[:id], household_params.to_h)

          if result[:success]
            render_success_response(result[:household])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def destroy
          result = CleanArch.labor_delete_farm_household.execute(params[:id])
          
          if result[:success]
            render_success_response({ message: result[:message] })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        private

        def set_household_id
          # Chỉ set ID, không load household
          @household_id = params[:id]
        end
        
        def require_household_owner
          household = CleanArch.labor_farm_household_repository.find(@household_id)
          
          unless household && household.owner_id == current_user.id
            render_error_response(["Bạn không có quyền thực hiện thao tác này"], :forbidden)
          end
        end

        def household_params
          params.require(:household).permit(:name, :description, :province, :district, :ward, :address)
        end
      end
    end
  end
end
