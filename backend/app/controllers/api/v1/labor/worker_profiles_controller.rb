# app/controllers/api/v1/labor/worker_profiles_controller.rb
module Api
  module V1
    module Labor
      class WorkerProfilesController < BaseController
        before_action :set_worker_profile, only: [:show, :update]
        before_action :authorize_profile, only: [:update]
        
        def index
          filters = params.permit(:skills, :max_daily_rate, :max_hourly_rate, :exclude_household_id).to_h
          @profiles = ::Labor::WorkerService.find_available_workers(filters)
          render_success_response(@profiles)
        end
        
        def show
          # Lấy thông tin chi tiết về worker bao gồm cả thống kê
          stats = ::Labor::WorkerService.worker_statistics(@worker_profile.user)
          render_success_response(stats)
        end
        
        def create
          result = ::Labor::WorkerService.create_or_update_profile(
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
          result = ::Labor::WorkerService.create_or_update_profile(
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
          profile = ::Labor::WorkerProfile.find_by(user_id: current_user.id)
          
          unless profile
            # Tạo mới profile nếu chưa có
            result = ::Labor::WorkerService.create_or_update_profile(
              current_user,
              { availability: :available }
            )
            
            if result[:success]
              stats = ::Labor::WorkerService.worker_statistics(current_user)
              render_success_response(stats)
            else
              render_error_response(result[:errors], :unprocessable_entity)
            end
          else
            stats = ::Labor::WorkerService.worker_statistics(current_user)
            render_success_response(stats)
          end
        end
        
        def available_workers
          filters = params.permit(:skills, :max_daily_rate, :max_hourly_rate, :exclude_household_id).to_h
          @workers = ::Labor::WorkerService.find_available_workers(filters)
          render_success_response(@workers)
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
