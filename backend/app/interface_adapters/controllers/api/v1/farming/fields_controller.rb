module Controllers::Api
  module V1
    module Farming
      class FieldsController < BaseController
        def index
          # Format filter params
          filter_params = ::Formatters::Farming::FieldFormatter.format_filter_params(params)

          result = ::Services::CleanArch.farming_list_fields.execute(
            current_user.user_id,
            filter_params
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
          # Format input params
          create_params = ::Formatters::Farming::FieldFormatter.format_create_params(
            field_params,
            current_user.user_id
          )

          result = Services::CleanArch.farming_create_field.execute(
            create_params,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field created successfully",
              data: ::Presenters::Farming::FieldPresenter.new(result[:field]).as_json
            }, status: :created
          else
            render json: { errors: result[:errors] }, status: :unprocessable_entity
          end
        end

        def update
          # Format input params
          update_params = ::Formatters::Farming::FieldFormatter.format_update_params(field_params)

          result = Services::CleanArch.farming_update_field.execute(
            params[:id],
            update_params,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: "Field updated successfully",
              data: ::Presenters::Farming::FieldPresenter.new(result[:field]).as_json
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
              data: result[:records].map { |record| ::Presenters::Farming::FieldActivityPresenter.new(record).as_json }
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
              data: result[:records].map { |record| ::Presenters::Farming::FieldHarvestPresenter.new(record).as_json }
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
              data: result[:records].map { |record| ::Presenters::Farming::FieldPineappleCropPresenter.new(record).as_json }
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
