# app/controllers/api/v1/labor/labor_requests_controller.rb
module Api
  module V1
    module Labor
      class LaborRequestsController < BaseController
        before_action :require_household, except: [:index, :show, :public_requests]
        before_action :set_labor_request, only: [:show, :update, :destroy, :accept, :decline, :join, :complete, :cancel, :group_status]
        
        # Liệt kê tất cả các yêu cầu
        def index
          @requests = current_household ? 
            ::Labor::LaborRequestService.find_requests_for_household(
              current_household.id, 
              filters_from_params
            ) :
            ::Labor::LaborRequest.all
          
          render_success_response(@requests)
        end
        
        # Hiển thị chi tiết của một yêu cầu
        def show
          render_success_response(@labor_request)
        end
        
        # Tạo yêu cầu thông thường
        def create
          result = ::Labor::LaborRequestService.create_request(
            current_household,
            labor_request_params
          )
          
          if result[:success]
            render_success_response(result[:request], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Tạo yêu cầu kết hợp (chỉ định + công khai)
        def create_mixed
          provider_ids = params[:provider_ids] || []
          options = {
            is_public: params[:is_public] || false,
            max_acceptors: params[:max_acceptors]
          }
          
          result = ::Labor::LaborRequestService.create_mixed_request(
            current_household,
            labor_request_params,
            provider_ids,
            options
          )
          
          if result[:success]
            render_success_response({
              parent_request: result[:parent_request],
              child_requests: result[:child_requests]
            }, :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Tham gia vào một yêu cầu công khai
        def join
          result = ::Labor::LaborRequestService.join_public_request(
            @labor_request,
            current_household
          )
          
          if result[:success]
            render_success_response(result[:request], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Xem tình trạng của nhóm yêu cầu
        def group_status
          if @labor_request.request_group_id.blank?
            render_error_response("Yêu cầu này không thuộc nhóm nào", :bad_request)
            return
          end
          
          related_requests = @labor_request.related_requests.includes(:providing_household)
          
          render_success_response({
            group_id: @labor_request.request_group_id,
            parent_id: @labor_request.original_request? ? @labor_request.id : @labor_request.parent_request_id,
            total: related_requests.count + 1,
            accepted: related_requests.where(status: :accepted).count + (@labor_request.accepted? ? 1 : 0),
            declined: related_requests.where(status: :declined).count + (@labor_request.declined? ? 1 : 0),
            pending: related_requests.where(status: :pending).count + (@labor_request.pending? ? 1 : 0)
          })
        end
        
        # Tìm các yêu cầu công khai
        def public_requests
          @requests = ::Labor::LaborRequest.public_requests
                       .where(status: :pending)
                       .includes(:requesting_household)
                       .order(created_at: :desc)
          
          # Loại trừ yêu cầu từ các nhóm đã tham gia
          if current_household && params[:exclude_joined] == 'true'
            joined_groups = ::Labor::LaborRequest.where(providing_household_id: current_household.id)
                              .pluck(:request_group_id)
                              .compact
                              .uniq
            
            @requests = @requests.where.not(request_group_id: joined_groups)
          end
          
          render_success_response(@requests)
        end
        
        # Cập nhật yêu cầu
        def update
          result = ::Labor::LaborRequestService.update_request(
            @labor_request,
            labor_request_params
          )
          
          if result[:success]
            render_success_response(result[:request])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Xóa yêu cầu
        def destroy
          if @labor_request.destroy
            render_success_response({ id: @labor_request.id, message: "Xóa yêu cầu thành công" })
          else
            render_error_response("Không thể xóa yêu cầu", :unprocessable_entity)
          end
        end
        
        # Chấp nhận yêu cầu
        def accept
          result = ::Labor::LaborRequestService.process_request(
            @labor_request,
            :accept,
            current_user
          )
          
          if result[:success]
            render_success_response({
              request: result[:request],
              group_status: result[:group_status]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Từ chối yêu cầu
        def decline
          result = ::Labor::LaborRequestService.process_request(
            @labor_request,
            :decline,
            current_user
          )
          
          if result[:success]
            render_success_response({
              request: result[:request],
              group_status: result[:group_status]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Hủy yêu cầu
        def cancel
          result = ::Labor::LaborRequestService.process_request(
            @labor_request,
            :cancel,
            current_user
          )
          
          if result[:success]
            render_success_response({
              request: result[:request],
              group_status: result[:group_status]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Hoàn thành yêu cầu
        def complete
          result = ::Labor::LaborRequestService.process_request(
            @labor_request,
            :complete,
            current_user
          )
          
          if result[:success]
            render_success_response({
              request: result[:request],
              group_status: result[:group_status]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Thêm endpoint để gợi ý người lao động
        def suggest_workers
          max_suggestions = params[:limit].to_i || 5
          
          workers = ::Labor::LaborRequestService.suggest_workers(
            @labor_request, 
            max_suggestions
          )
          
          render_success_response({
            request_id: @labor_request.id,
            suggested_workers: workers.map { |w| 
              {
                id: w.id,
                name: w.fullname || w.user_name,
                skills: w.worker_profile&.skills || [],
                profile_image: w.profile_image_url,
              }
            }
          })
        end
        
        # Bổ sung endpoint để lọc yêu cầu theo hoạt động nông nghiệp
        def for_activity
          @farm_activity_id = params[:farm_activity_id]
          unless @farm_activity_id
            render_error_response("Missing farm_activity_id", :bad_request)
            return
          end
          
          @requests = ::Labor::LaborRequest.where(farm_activity_id: @farm_activity_id.to_i)
                                         .where(requesting_household_id: current_household.id)
                                         .or(::Labor::LaborRequest.where(providing_household_id: current_household.id))
          
          render_success_response(@requests.as_json)
        end
        
        private
        
        def set_labor_request
          @labor_request = ::Labor::LaborRequest.find(params[:id])
        end
        
        def labor_request_params
          params.require(:labor_request).permit(
            :title, :description, :workers_needed, :request_type, :rate,
            :start_date, :end_date, :start_time, :end_time, :farm_activity_id, 
            :providing_household_id
          )
        end
        
        def filters_from_params
          {
            status: params[:status],
            include_children: params[:include_children] == 'true',
            exclude_joined: params[:exclude_joined] == 'true'
          }
        end
      end
    end
  end
end
