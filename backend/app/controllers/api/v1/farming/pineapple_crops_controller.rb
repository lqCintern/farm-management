module Api
  module V1
    module Farming
      class PineappleCropsController < BaseController
        before_action :authenticate_user!

        # GET /api/v1/farming/pineapple_crops
        def index
          # Format filter params
          filter_params = ::Farming::PineappleCropFormatter.format_filter_params(params)

          # Execute use case
          pagy, pineapple_crops = CleanArch.farming_list_pineapple_crops.execute(
            user_id: current_user.user_id,
            filters: filter_params,
            page: params[:page] || 1,
            per_page: params[:per_page] || 10
          )

          # Format response using presenter
          response = ::Farming::PineappleCropPresenter.present_collection(pineapple_crops, pagy)

          render json: response, status: :ok
        end

        # GET /api/v1/farming/pineapple_crops/:id
        def show
          # Execute use case
          result = CleanArch.farming_get_pineapple_crop.execute(params[:id])

          if result[:success]
            # Format response using presenter
            render json: ::Farming::PineappleCropPresenter.new(result[:pineapple_crop]).as_detail,
                   status: :ok
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        # POST /api/v1/farming/pineapple_crops
        def create
          # Format input params
          create_params = ::Farming::PineappleCropFormatter.format_create_params(
            pineapple_crop_params,
            current_user.user_id
          )

          # Execute use case
          result = CleanArch.farming_create_pineapple_crop.execute(create_params)

          # Format response
          response_data = ::Farming::PineappleCropPresenter.format_response(result)

          if result[:success]
            render json: response_data, status: :created
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        # PUT /api/v1/farming/pineapple_crops/:id
        def update
          # Format input params
          update_params = ::Farming::PineappleCropFormatter.format_update_params(
            pineapple_crop_params
          )

          # Execute use case
          result = CleanArch.farming_update_pineapple_crop.execute(
            id: params[:id],
            attributes: update_params,
            user_id: current_user.user_id
          )

          # Format response
          response_data = ::Farming::PineappleCropPresenter.format_response(result)

          if result[:success]
            render json: response_data, status: :ok
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/farming/pineapple_crops/:id
        def destroy
          result = CleanArch.farming_delete_pineapple_crop.execute(
            id: params[:id],
            user_id: current_user.user_id
          )

          if result[:success]
            render json: { message: result[:message] }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_crops/:id/generate_plan
        def generate_plan
          result = CleanArch.farming_generate_pineapple_plan.execute(
            id: params[:id],
            user_id: current_user.user_id
          )

          if result[:success]
            render json: {
              message: result[:message],
              pineapple_crop: ::Farming::PineappleCropPresenter.new(result[:pineapple_crop]).as_detail
            }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_crops/:id/advance_stage
        def advance_stage
          result = CleanArch.farming_advance_stage.execute(
            id: params[:id],
            user_id: current_user.user_id
          )

          if result[:success]
            render json: {
              message: result[:message],
              pineapple_crop: ::Farming::PineappleCropPresenter.new(result[:pineapple_crop]).as_json
            }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_crops/:id/record_harvest
        def record_harvest
          result = CleanArch.farming_record_harvest.execute(
            id: params[:id],
            quantity: params[:quantity],
            user_id: current_user.user_id
          )

          if result[:success]
            render json: {
              message: result[:message],
              pineapple_crop: ::Farming::PineappleCropPresenter.new(result[:pineapple_crop]).as_json
            }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_crops/preview_plan
        def preview_plan
          result = CleanArch.farming_preview_plan.execute(pineapple_crop_params)

          response_data = ::Farming::PineappleCropPresenter.format_preview_plan(result)

          if result[:success]
            render json: response_data, status: :ok
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_crops/:id/confirm_plan
        def confirm_plan
          activities_params = ::Farming::PineappleCropFormatter.format_activities_params(
            params.require(:activities)
          )

          result = CleanArch.farming_confirm_plan.execute(
            id: params[:id],
            activities_params: activities_params,
            user_id: current_user.user_id
          )

          response_data = ::Farming::PineappleCropPresenter.format_confirm_plan_response(result)

          if result[:success]
            render json: response_data, status: :ok
          else
            render json: response_data, status: :unprocessable_entity
          end
        end

        # GET /api/v1/farming/pineapple_crops/statistics
        def statistics
          result = CleanArch.farming_get_statistics.execute(user_id: current_user.user_id)

          if result[:success]
            render json: ::Farming::PineappleCropPresenter.format_statistics(result[:statistics]),
                   status: :ok
          else
            render json: { error: "Không thể lấy thống kê" }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/farming/pineapple_crops/:id/clean_activities
        def clean_activities
          result = CleanArch.farming_clean_activities.execute(
            id: params[:id],
            user_id: current_user.user_id
          )

          if result[:success]
            render json: { message: result[:message] }, status: :ok
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        private

        def pineapple_crop_params
          params.require(:pineapple_crop).permit(
            :name, :field_id, :planting_date, :harvest_date,
            :field_area, :season_type, :planting_density,
            :status, :description, :variety, :source,
            :current_stage, :expected_yield, :location
          )
        end
      end
    end
  end
end
