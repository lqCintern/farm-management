module Controllers::Api
  module V1
    module Farming
      class FarmActivitiesController < BaseController
        include PaginationHelper

        def index
          # Format filter params
          filter_params = ::Formatters::Farming::FarmActivityFormatter.format_filter_params(params)

          result = Services::CleanArch.farming_list_farm_activities.execute(
            current_user.user_id,
            filter_params
          )

          # Phân trang kết quả
          @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
          activities = records.map { |record| Services::CleanArch.farming_farm_activity_repository.send(:map_to_entity, record) }

          render json: ::Presenters::Farming::FarmActivityPresenter.collection_as_json(activities, @pagy), status: :ok
        end

        def show
          result = Services::CleanArch.farming_get_farm_activity.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: { data: ::Presenters::Farming::FarmActivityPresenter.new(result[:farm_activity]).as_json }, status: :ok
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def create
          # Format input params
          create_params = ::Formatters::Farming::FarmActivityFormatter.format_create_params(
            farm_activity_params,
            current_user.user_id
          )

          # Kiểm tra xem có muốn tạo labor request tự động không
          if params[:auto_create_labor] == "true"
            result = Services::CleanArch.farming_create_activity_with_labor.execute(
              create_params,
              current_user.user_id
            )
          else
            result = Services::CleanArch.farming_create_farm_activity.execute(create_params, current_user.user_id)
          end

          response_data = ::Presenters::Farming::FarmActivityPresenter.format_response(result.merge(action: "created"))

          if result[:success]
            render json: response_data, status: :created
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        def update
          # Format input params
          update_params = ::Formatters::Farming::FarmActivityFormatter.format_update_params(farm_activity_params)

          result = Services::CleanArch.farming_update_farm_activity.execute(
            params[:id],
            update_params,
            current_user.user_id
          )

          if result[:success]
            # Đồng bộ labor request status nếu có
            Services::CleanArch.farming_sync_labor_request_status.execute(params[:id])
            
            response_data = ::Presenters::Farming::FarmActivityPresenter.format_response(result.merge(action: "updated"))
            render json: response_data, status: :ok
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        def destroy
          result = Services::CleanArch.farming_delete_farm_activity.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: { message: "Đã hủy lịch chăm sóc thành công" }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        def complete
          # Format completion params
          formatted_completion_params = ::Formatters::Farming::FarmActivityFormatter.format_completion_params(completion_params)

          result = Services::CleanArch.farming_complete_farm_activity.execute(
            params[:id],
            formatted_completion_params,
            current_user.user_id
          )

          if result[:success]
            # Đồng bộ labor request status nếu có
            Services::CleanArch.farming_sync_labor_request_status.execute(params[:id])
            
            response_data = ::Presenters::Farming::FarmActivityPresenter.format_completion_response(result)
            render json: response_data, status: :ok
          else
            render json: { success: false, error: result[:error] }, status: :unprocessable_entity
          end
        end

        def statistics
          # Format statistics params
          stats_params = ::Formatters::Farming::FarmActivityFormatter.format_statistics_params(params)

          result = Services::CleanArch.farming_get_farm_activity_stats.execute(
            current_user.user_id,
            stats_params[:period],
            stats_params[:year],
            stats_params[:month],
            stats_params[:quarter]
          )

          response_data = ::Presenters::Farming::FarmActivityPresenter.format_statistics_response(result)
          render json: response_data, status: :ok
        end

        def history_by_field
          result = Services::CleanArch.farming_get_farm_activity_history_by_field.execute(
            current_user.user_id,
            params[:crop_animal_id]
          )

          # Phân trang kết quả
          @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
          activities = records.map { |record| Services::CleanArch.farming_farm_activity_repository.send(:map_to_entity, record) }

          render json: {
            history: ::Presenters::Farming::FarmActivityPresenter.collection_as_json(activities, @pagy)[:farm_activities],
            pagination: pagy_metadata(@pagy)
          }, status: :ok
        end

        def stage_activities
          result = Services::CleanArch.farming_get_stage_activities.execute(
            params[:pineapple_crop_id],
            current_user.user_id,
            params[:current_stage_only] == "true"
          )

          if result[:success]
            @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
            activities = records.map { |record| Services::CleanArch.farming_farm_activity_repository.send(:map_to_entity, record) }

            render json: {
              data: ::Presenters::Farming::FarmActivityPresenter.collection_as_json(activities, @pagy),
              stage: result[:stage],
              pagination: pagy_metadata(@pagy)
            }, status: :ok
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        private

        def farm_activity_params
          params.require(:farm_activity).permit(
            :activity_type,
            :description,
            :frequency,
            :status,
            :start_date,
            :end_date,
            :crop_animal_id,
            :field_id,
            :coordinates,
            materials: {}
          )
        end

        def completion_params
          params.require(:farm_activity).permit(
            :actual_notes,
            actual_materials: {}
          )
        end
      end
    end
  end
end
