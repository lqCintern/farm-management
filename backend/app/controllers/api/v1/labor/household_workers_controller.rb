# app/controllers/api/v1/labor/household_workers_controller.rb
module Api
  module V1
    module Labor
      class HouseholdWorkersController < BaseController
        before_action :set_household, only: [ :create ]
        before_action :require_household_owner, only: [ :create, :destroy, :update_status ]
        before_action :set_household_worker, only: [ :show, :destroy, :update_status ]

        def index
          # Kiểm tra xem có farm_household_id không
          if params[:farm_household_id]
            @household = ::Labor::FarmHousehold.find(params[:farm_household_id])
          else
            # Sử dụng current_household từ BaseController
            @household = current_household
          end

          @workers = @household.household_workers.includes(:worker).active

          # Định dạng kết quả trả về để phù hợp với frontend
          formatted_workers = @workers.map do |hw|
            worker_profile = ::Labor::WorkerProfile.find_by(user_id: hw.worker.id)
            {
              id: hw.worker.id,
              name: hw.worker.fullname || hw.worker.user_name,
              relationship: hw.relationship,
              skills: worker_profile&.skills || [],
              joined_date: hw.joined_date
            }
          end

          render_success_response(formatted_workers)
        end

        def show
          render_success_response(@household_worker)
        end

        def create
          worker_user = User.find(worker_params[:worker_id])

          result = ::Labor::HouseholdService.add_worker(
            @household,
            worker_user,
            worker_params.to_h
          )

          if result[:success]
            render_success_response(result[:worker_relation], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def destroy
          if @household_worker.destroy
            render_success_response({ message: "Đã xóa thành viên hộ thành công" })
          else
            render_error_response(@household_worker.errors.full_messages, :unprocessable_entity)
          end
        end

        def update_status
          is_active = params[:is_active]

          if is_active.nil?
            render_error_response("Thiếu tham số is_active", :bad_request)
            return
          end

          if is_active
            @household_worker.activate!
          else
            @household_worker.deactivate!
          end

          render_success_response(@household_worker)
        end

        private

        def set_household
          @household = ::Labor::FarmHousehold.find(params[:farm_household_id])
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
