module Api
  module V1
    module Farming
      class HarvestsController < BaseController
        def index
          result = CleanArch.farming_list_harvests.execute(
            current_user.user_id,
            {
              start_date: params[:start_date],
              end_date: params[:end_date],
              crop_id: params[:crop_id],
              field_id: params[:field_id]
            }
          )
          
          render json: {
            message: "Harvests retrieved successfully",
            data: ::Farming::HarvestPresenter.collection_as_json(result[:harvests])
          }
        end
        
        def show
          result = CleanArch.farming_get_harvest.execute(params[:id], current_user.user_id)
          
          if result[:success]
            render json: {
              message: "Harvest retrieved successfully",
              data: ::Farming::HarvestPresenter.as_json(result[:harvest])
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end
        
        def create
          result = CleanArch.farming_create_harvest.execute(
            harvest_params.to_h,
            current_user.user_id
          )
          
          if result[:success]
            render json: {
              message: "Harvest created successfully",
              data: ::Farming::HarvestPresenter.as_json(result[:harvest])
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end
        
        def update
          result = CleanArch.farming_update_harvest.execute(
            params[:id],
            harvest_params.to_h,
            current_user.user_id
          )
          
          if result[:success]
            render json: {
              message: "Harvest updated successfully",
              data: ::Farming::HarvestPresenter.as_json(result[:harvest])
            }
          else
            render json: { errors: result[:errors] || [result[:error]] }, status: :unprocessable_entity
          end
        end
        
        def destroy
          result = CleanArch.farming_delete_harvest.execute(
            params[:id],
            current_user.user_id
          )
          
          if result[:success]
            render json: {
              message: "Harvest deleted successfully"
            }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end
        
        def by_crop
          result = CleanArch.farming_get_harvests_by_crop.execute(
            params[:crop_id],
            current_user.user_id
          )
          
          render json: {
            message: "Harvests for crop retrieved successfully",
            data: ::Farming::HarvestPresenter.collection_as_json(result[:harvests])
          }
        end
        
        def by_field
          result = CleanArch.farming_get_harvests_by_field.execute(
            params[:field_id],
            current_user.user_id
          )
          
          render json: {
            message: "Harvests for field retrieved successfully",
            data: ::Farming::HarvestPresenter.collection_as_json(result[:harvests])
          }
        end
        
        def stats
          result = CleanArch.farming_get_harvest_stats.execute(current_user.user_id)
          
          if result[:success]
            render json: {
              message: "Harvest statistics retrieved successfully",
              data: {
                monthly: result[:monthly],
                by_crop: result[:by_crop],
                by_field: result[:by_field],
                total_quantity: result[:total_quantity],
                harvest_count: result[:harvest_count]
              }
            }
          else
            render json: { error: "Không thể lấy thống kê thu hoạch" }, status: :internal_server_error
          end
        end
        
        private
        
        def harvest_params
          params.require(:harvest).permit(
            :quantity,
            :harvest_date,
            :crop_id,
            :field_id,
            :farm_activity_id,
            coordinates: [ :lat, :lng ]
          )
        end
      end
    end
  end
end
