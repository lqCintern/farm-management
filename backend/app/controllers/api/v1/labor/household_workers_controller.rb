# app/controllers/api/v1/labor/household_workers_controller.rb
module Api
  module V1
    module Labor
      class HouseholdWorkersController < BaseController
        before_action :set_household, only: [:index, :create]
        before_action :require_household_owner, only: [:create, :destroy, :update_status]
        before_action :set_household_worker, only: [:show, :destroy, :update_status]

        def index
          # Kiểm tra xem có farm_household_id không
          if params[:farm_household_id]
            household_id = params[:farm_household_id]
          else
            # Sử dụng current_household từ BaseController
            household_id = current_household.id
          end

          workers = CleanArch.labor_list_household_workers.execute(household_id)
          render_success_response(workers)
        end

        def show
          render_success_response(@household_worker)
        end

        def create
          worker_user = User.find(worker_params[:worker_id])
          
          result = CleanArch.labor_add_worker_to_household.execute(
            @household.id,
            worker_user.id,
            worker_params.to_h
          )
          
          if result[:success]
            render_success_response(result[:worker_relation], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def destroy
          result = CleanArch.labor_remove_worker.execute(
            params[:id],
            current_user
          )
          
          if result[:success]
            render_success_response({ message: result[:message] })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def update_status
          is_active = params[:is_active]
          
          if is_active.nil?
            render_error_response("Thiếu tham số is_active", :bad_request)
            return
          end
          
          result = CleanArch.labor_update_worker_status.execute(
            params[:id],
            is_active,
            current_user
          )
          
          if result[:success]
            render_success_response(result[:worker_relation])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        private

        def set_household
          @household = ::Labor::FarmHousehold.find(params[:farm_household_id]) if params[:farm_household_id]
        end

        def set_household_worker
          @household_worker = ::Labor::HouseholdWorker.find(params[:id])
          @household = @household_worker.household
        end

        def worker_params
          params.require(:worker).permit(:worker_id, :relationship, :joined_date, :notes)
        end
      end
    end
  end
end
