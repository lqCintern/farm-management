module Controllers::Api
  module V1
    module Farming
      class FieldsController < BaseController
        def index
          result = ::Services::CleanArch.farming_list_fields.execute(
            current_user.user_id,
            {
              name: params[:name],
              location: params[:location]
            }
          )

          render json: {
            message: "Fields retrieved successfully",
            data: ::Presenters::Farming::FieldPresenter.collection_as_json(result[:fields])[:data]
          }
        end

        def show
          result = ::Services::CleanArch.farming_get_field.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: {
              message: "Field retrieved successfully",
              data: ::Presenters::Farming::FieldPresenter.as_json(result[:field])
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def create
          result = Services::CleanArch.farming_create_field.execute(
            field_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field created successfully",
              data: ::Presenters::Farming::FieldPresenter.as_json(result[:field])
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        def update
          result = Services::CleanArch.farming_update_field.execute(
            params[:id],
            field_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field updated successfully",
              data: ::Presenters::Farming::FieldPresenter.as_json(result[:field])
            }
          else
            render json: { errors: result[:errors] || [ result[:error] ] }, status: :unprocessable_entity
          end
        end

        def destroy
          result = Services::CleanArch.farming_delete_field.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: { message: "Field deleted successfully" }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        def activities
          result = Services::CleanArch.farming_get_field_activities.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field activities retrieved successfully",
              data: result[:records].map { |record| ::Farming::FieldActivityPresenter.as_json(record) }
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def harvests
          result = Services::CleanArch.farming_get_field_harvests.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field harvests retrieved successfully",
              data: result[:records].map { |record| ::Farming::FieldHarvestPresenter.as_json(record) }
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def pineapple_crops
          result = Services::CleanArch.farming_get_field_pineapple_crops.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field pineapple crops retrieved successfully",
              data: result[:records].map { |record| ::Farming::FieldPineappleCropPresenter.as_json(record) }
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def stats
          result = Services::CleanArch.farming_get_field_stats.execute(current_user.user_id)

          if result[:success]
            render json: {
              message: "Field statistics retrieved successfully",
              data: {
                total_fields: result[:total_fields],
                total_area: result[:total_area],
                crops_by_field: result[:crops_by_field],
                activities_by_field: result[:activities_by_field],
                harvests_by_field: result[:harvests_by_field]
              }
            }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        private

        def field_params
          params.require(:field).permit(
            :name,
            :description,
            :location,
            :area,
            coordinates: [ [ :lat, :lng ] ]
          )
        end
      end
    end
  end
end
