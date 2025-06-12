# app/controllers/api/v1/labor/worker_profiles_controller.rb
module Api
  module V1
    module Labor
      class WorkerProfilesController < BaseController
        before_action :set_worker_profile, only: [:show]
        before_action :authorize_profile, only: [:update]

        def index
          filters = params.permit(:skills, :max_daily_rate, :max_hourly_rate, :exclude_household_id).to_h
          profiles = CleanArch.labor_find_available_workers.execute(filters)
          render_success_response(profiles)
        end

        def show
          # Lấy thông tin chi tiết về worker bao gồm cả thống kê
          stats = CleanArch.labor_get_worker_statistics.execute(@worker_profile.user)
          render_success_response(stats)
        end

        def create
          result = CleanArch.labor_create_or_update_profile.execute(
            current_user,
            worker_profile_params.to_h
          )
          
          if result[:success]
            render_success_response(result[:profile], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def update
          result = CleanArch.labor_create_or_update_profile.execute(
            current_user,
            worker_profile_params.to_h
          )
          
          if result[:success]
            render_success_response(result[:profile])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def my_profile
          result = CleanArch.labor_get_or_create_profile.execute(current_user)
          
          if result[:success]
            stats = CleanArch.labor_get_worker_statistics.execute(current_user)
            render_success_response(stats)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def available_workers
          filters = params.permit(:skills, :max_daily_rate, :max_hourly_rate, :exclude_household_id).to_h
          workers = CleanArch.labor_find_available_workers.execute(filters)
          render_success_response(workers)
        end
        
        def worker_availability
          worker_id = params[:worker_id].to_i
          start_date = params[:start_date] || Date.today.to_s
          end_date = params[:end_date] || (Date.today + 14.days).to_s
          
          result = CleanArch.labor_check_worker_availability.execute(
            worker_id,
            start_date,
            end_date
          )
          
          render_success_response(result)
        end

        private

        def set_worker_profile
          @worker_profile = ::Labor::WorkerProfile.find(params[:id])
        end

        def authorize_profile
          unless @worker_profile.user_id == current_user.id
            render_error_response("Bạn không có quyền cập nhật hồ sơ này", :forbidden)
          end
        end

        def worker_profile_params
          params.require(:worker_profile).permit(:skills, :daily_rate, :hourly_rate, :availability)
        end
      end
    end
  end
end
