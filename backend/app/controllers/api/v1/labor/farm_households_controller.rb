# app/controllers/api/v1/labor/farm_households_controller.rb
module Api
  module V1
    module Labor
      class FarmHouseholdsController < BaseController
        before_action :set_household, only: [:show, :update, :destroy]
        before_action :require_household_owner, only: [:update, :destroy]
        
        def index
          @households = ::Labor::FarmHousehold.all
          render_success_response(@households)
        end
        
        def show
          summary = ::Labor::HouseholdService.household_summary(@household)
          render_success_response(summary)
        end
        
        def create
          result = ::Labor::HouseholdService.create_household(current_user, household_params.to_h)
          
          if result[:success]
            render_success_response(result[:household], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def update
          result = ::Labor::HouseholdService.update_household(@household, household_params.to_h)
          
          if result[:success]
            render_success_response(result[:household])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def destroy
          if @household.destroy
            render_success_response({ message: "Đã xóa hộ sản xuất thành công" })
          else
            render_error_response(@household.errors.full_messages, :unprocessable_entity)
          end
        end
        
        private
        
        def set_household
          @household = ::Labor::FarmHousehold.find(params[:id])
        end
        
        def household_params
          params.require(:household).permit(:name, :description, :province, :district, :ward, :address)
        end
      end
    end
  end
end
