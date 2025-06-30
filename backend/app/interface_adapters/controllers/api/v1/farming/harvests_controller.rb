module Controllers::Api
  module V1
    module Farming
      class HarvestsController < BaseController
        def index
          # Format filter params
          filter_params = ::Formatters::Farming::HarvestFormatter.format_filter_params(params)

          result = Services::CleanArch.farming_list_harvests.execute(
            current_user.user_id,
            filter_params
          )

          render json: {
            message: "Harvests retrieved successfully",
            data: ::Presenters::Farming::HarvestPresenter.collection_as_json(result[:harvests])
          }
        end

        def show
          result = Services::CleanArch.farming_get_harvest.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: {
              message: "Harvest retrieved successfully",
              data: ::Presenters::Farming::HarvestPresenter.new(result[:harvest]).as_json
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def create
          # Format input params
          create_params = ::Formatters::Farming::HarvestFormatter.format_create_params(
            harvest_params,
            current_user.user_id
          )

          result = Services::CleanArch.farming_create_harvest.execute(
            create_params,
            current_user.user_id
          )

          response_data = ::Presenters::Farming::HarvestPresenter.format_response(result.merge(action: "created"))

          if result[:success]
            render json: response_data, status: :created
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        def update
          # Format input params
          update_params = ::Formatters::Farming::HarvestFormatter.format_update_params(harvest_params)

          result = Services::CleanArch.farming_update_harvest.execute(
            params[:id],
            update_params,
            current_user.user_id
          )

          response_data = ::Presenters::Farming::HarvestPresenter.format_response(result.merge(action: "updated"))

          if result[:success]
            render json: response_data
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        def destroy
          result = Services::CleanArch.farming_delete_harvest.execute(
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
          result = Services::CleanArch.farming_get_harvests_by_crop.execute(
            params[:crop_id],
            current_user.user_id
          )

          render json: {
            message: "Harvests for crop retrieved successfully",
            data: ::Presenters::Farming::HarvestPresenter.collection_as_json(result[:harvests])
          }
        end

        def by_field
          result = Services::CleanArch.farming_get_harvests_by_field.execute(
            params[:field_id],
            current_user.user_id
          )

          render json: {
            message: "Harvests for field retrieved successfully",
            data: ::Presenters::Farming::HarvestPresenter.collection_as_json(result[:harvests])
          }
        end

        def stats
          result = Services::CleanArch.farming_get_harvest_stats.execute(current_user.user_id)

          response_data = ::Presenters::Farming::HarvestPresenter.format_statistics_response(result)

          if result[:success]
            render json: response_data
          else
            render json: response_data, status: :internal_server_error
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
