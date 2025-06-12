module Api
  module V1
    module Farming
      class FarmActivitiesController < BaseController
        include PaginationHelper
        
        def index
          result = CleanArch.farming_list_farm_activities.execute(
            current_user.user_id,
            {
              start_date: params[:start_date],
              end_date: params[:end_date],
              activity_type: params[:activity_type],
              crop_animal_id: params[:crop_animal_id],
              status: params[:status]
            }
          )
          
          # Phân trang kết quả
          @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
          activities = records.map { |record| CleanArch.farming_farm_activity_repository.send(:map_to_entity, record) }
          
          render json: ::Farming::FarmActivityPresenter.collection_as_json(activities, @pagy), status: :ok
        end
        
        def show
          result = CleanArch.farming_get_farm_activity.execute(params[:id], current_user.user_id)
          
          if result[:success]
            render json: { data: ::Farming::FarmActivityPresenter.as_json(result[:farm_activity]) }, status: :ok
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end
        
        def create
          result = CleanArch.farming_create_farm_activity.execute(
            farm_activity_params.to_h,
            current_user.user_id
          )
          
          if result[:success]
            render json: {
              message: "Lịch chăm sóc đã được tạo thành công",
              data: ::Farming::FarmActivityPresenter.as_json(result[:farm_activity])
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end
        
        def update
          result = CleanArch.farming_update_farm_activity.execute(
            params[:id],
            farm_activity_params.to_h,
            current_user.user_id
          )
          
          if result[:success]
            render json: {
              message: "Lịch chăm sóc đã được cập nhật thành công",
              data: ::Farming::FarmActivityPresenter.as_json(result[:farm_activity])
            }, status: :ok
          else
            render json: { errors: result[:error] || result[:errors] }, status: :unprocessable_entity
          end
        end
        
        def destroy
          result = CleanArch.farming_delete_farm_activity.execute(
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
          result = CleanArch.farming_complete_farm_activity.execute(
            params[:id],
            completion_params.to_h,
            current_user.user_id
          )
          
          if result[:success]
            render json: {
              message: "Đã đánh dấu hoàn thành hoạt động",
              data: ::Farming::FarmActivityPresenter.as_json(result[:farm_activity]),
              suggestion: result[:suggestion]
            }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end
        
        def statistics
          result = CleanArch.farming_get_farm_activity_stats.execute(
            current_user.user_id,
            params[:period] || "month",
            params[:year].present? ? params[:year].to_i : Date.today.year,
            params[:month].present? ? params[:month].to_i : Date.today.month,
            params[:quarter].present? ? params[:quarter].to_i : ((Date.today.month - 1) / 3 + 1)
          )
          
          render json: { statistics: result[:statistics] }, status: :ok
        end
        
        def history_by_field
          result = CleanArch.farming_get_farm_activity_history_by_field.execute(
            current_user.user_id,
            params[:crop_animal_id]
          )
          
          # Phân trang kết quả
          @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
          activities = records.map { |record| CleanArch.farming_farm_activity_repository.send(:map_to_entity, record) }
          
          render json: { 
            history: ::Farming::FarmActivityPresenter.collection_as_json(activities, @pagy)[:farm_activities],
            pagination: pagy_metadata(@pagy)
          }, status: :ok
        end
        
        def stage_activities
          result = CleanArch.farming_get_stage_activities.execute(
            params[:pineapple_crop_id], 
            current_user.user_id,
            params[:current_stage_only] == "true"
          )
          
          if result[:success]
            @pagy, records = pagy(result[:records], items: params[:per_page] || 10)
            activities = records.map { |record| CleanArch.farming_farm_activity_repository.send(:map_to_entity, record) }
            
            render json: { 
              data: ::Farming::FarmActivityPresenter.collection_as_json(activities, @pagy),
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
