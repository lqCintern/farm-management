# app/controllers/api/v1/labor/labor_requests_controller.rb
module Api
  module V1
    module Labor
      class LaborRequestsController < BaseController
        before_action :require_household, except: [:index, :show, :public_requests]
        before_action :set_labor_request, only: [:show, :update, :destroy, :accept, :decline, :join, :complete, :cancel, :group_status, :suggest_workers]

        # Liệt kê tất cả các yêu cầu
        def index
          filters = filters_from_params
          
          if current_household
            requests = CleanArch.labor_list_requests.execute(current_household.id, filters)
            render_success_response(requests)
          else
            render_success_response([])
          end
        end

        # Hiển thị chi tiết của một yêu cầu
        def show
          request_result = CleanArch.labor_get_request.execute(params[:id])
          
          if request_result[:success]
            render_success_response(request_result[:request])
          else
            render_error_response(request_result[:errors], :not_found)
          end
        end

        # Tạo yêu cầu thường
        def create
          result = CleanArch.labor_create_request.execute(
            current_household.id,
            labor_request_params.to_h
          )

          if result[:success]
            # Thêm thông báo nếu có providing_household
            if result[:request].providing_household_id.present?
              notification_dto = CleanArch.prepare_labor_notification.execute(result[:request])
              CleanArch.notification_service.new_labor_request(notification_dto)
            end

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

          result = CleanArch.labor_create_mixed_request.execute(
            current_household.id,
            labor_request_params.to_h,
            provider_ids,
            options
          )

          if result[:success]
            # Gửi thông báo cho các providing households
            result[:child_requests].each do |child_request|
              if child_request[:providing_household_id].present?
                notification_dto = CleanArch.prepare_labor_notification.execute(child_request)
                CleanArch.notification_service.new_labor_request(notification_dto)
              end
            end
            
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
          result = CleanArch.labor_join_request.execute(
            params[:id], 
            current_household.id, 
            current_user.id
          )

          if result[:success]
            # Thông báo cho người tạo yêu cầu
              notification_dto = CleanArch.prepare_labor_notification.execute(result[:request])
              CleanArch.notification_service.new_labor_request(notification_dto)
            render_success_response(result[:request], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Xem tình trạng của nhóm yêu cầu
        def group_status
          result = CleanArch.labor_get_group_status.execute(params[:id])
          
          if result[:success]
            render_success_response(result[:status])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Tìm các yêu cầu công khai
        def public_requests
          filters = public_request_filters_from_params
          
          if current_household
            filters[:exclude_household_id] = current_household.id
          end
          
          requests = CleanArch.labor_list_public_requests.execute(filters)
          render_success_response(requests)
        end

        # Cập nhật yêu cầu
        def update
          result = CleanArch.labor_update_request.execute(
            params[:id],
            labor_request_params.to_h,
            current_user.id
          )

          if result[:success]
            render_success_response(result[:request])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Xóa yêu cầu
        def destroy
          result = CleanArch.labor_delete_request.execute(params[:id], current_user.id)
          
          if result[:success]
            render_success_response({ id: params[:id], message: "Xóa yêu cầu thành công" })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Chấp nhận yêu cầu
        def accept
          result = CleanArch.labor_process_request.execute(
            params[:id], 
            :accept, 
            current_user.id
          )

          if result[:success]
            # Thông báo cho người tạo yêu cầu
            CleanArch.notification_service.labor_request_response(
              result[:request],
              "accepted"
            )

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
          result = CleanArch.labor_process_request.execute(
            params[:id], 
            :decline, 
            current_user.id
          )

          if result[:success]
            # Thông báo cho người tạo yêu cầu
            CleanArch.notification_service.labor_request_response(
              result[:request],
              "rejected"
            )

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
          result = CleanArch.labor_process_request.execute(
            params[:id], 
            :cancel, 
            current_user.id
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
          result = CleanArch.labor_process_request.execute(
            params[:id], 
            :complete, 
            current_user.id
          )

          if result[:success]
            # Thông báo cho các bên liên quan
            CleanArch.notification_service.labor_request_response(
              result[:request],
              "completed"
            )

            render_success_response({
              request: result[:request],
              group_status: result[:group_status]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Gợi ý người lao động
        def suggest_workers
          max_suggestions = params[:limit].to_i || 5

          result = CleanArch.labor_suggest_workers.execute(
            params[:id],
            max_suggestions
          )

          if result[:success]
            render_success_response({
              request_id: params[:id],
              suggested_workers: result[:workers]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        # Lọc yêu cầu theo hoạt động nông nghiệp
        def for_activity
          farm_activity_id = params[:farm_activity_id]
          unless farm_activity_id
            render_error_response("Missing farm_activity_id", :bad_request)
            return
          end

          result = CleanArch.labor_list_requests_by_activity.execute(
            current_household.id,
            farm_activity_id.to_i
          )

          render_success_response(result)
        end

        private

        def set_labor_request
          result = CleanArch.labor_get_request.execute(params[:id])
          
          if result[:success]
            @labor_request = result[:request]
          else
            render_error_response("Không tìm thấy yêu cầu lao động", :not_found)
          end
        end

        def labor_request_params
          params.require(:labor_request).permit(
            :title, :description, :workers_needed, :request_type, :rate,
            :start_date, :end_date, :start_time, :end_time, :farm_activity_id,
            :providing_household_id, :is_public, :max_acceptors
          )
        end

        def filters_from_params
          {
            status: params[:status],
            include_children: params[:include_children] == "true",
            exclude_joined: params[:exclude_joined] == "true"
          }
        end

        def public_request_filters_from_params
          filters = params.permit(:requesting_household_id).to_h
          
          if params[:date_range].present?
            filters[:date_range] = params.require(:date_range).permit(:start, :end).to_h
          end
          
          if params[:skills].present?
            filters[:skills] = params[:skills].is_a?(Array) ? params[:skills] : [params[:skills]]
          end
          
          filters
        end
      end
    end
  end
end
