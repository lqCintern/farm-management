module Api
  module V1
    module Farming
      class HarvestsController < BaseController
        before_action :set_harvest, only: [ :show, :update, :destroy ]

        # GET /api/v1/harvests
        def index
          harvests = current_user.harvests
                                .includes(:crop_animal, :field, :farm_activity)
                                .order(harvest_date: :desc)

          render json: {
            message: "Harvests retrieved successfully",
            data: harvests.map { |h| harvest_response(h) }
          }
        end

        # GET /api/v1/harvests/:id
        def show
          render json: {
            message: "Harvest retrieved successfully",
            data: harvest_response(@harvest)
          }
        end

        # POST /api/v1/harvests
        def create
          harvest = current_user.harvests.new(harvest_params)

          # Tự động lấy field_id từ crop_animal nếu không được cung cấp
          if harvest.field_id.blank? && harvest.crop_animal&.field_id.present?
            harvest.field_id = harvest.crop_animal.field_id
          end

          if harvest.save
            render json: {
              message: "Harvest created successfully",
              data: harvest_response(harvest)
            }, status: :created
          else
            render json: { errors: harvest.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PUT /api/v1/harvests/:id
        def update
          if @harvest.update(harvest_params)
            render json: {
              message: "Harvest updated successfully",
              data: harvest_response(@harvest)
            }
          else
            render json: { errors: @harvest.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/harvests/:id
        def destroy
          @harvest.destroy
          render json: {
            message: "Harvest deleted successfully"
          }
        end

        # GET /api/v1/harvests/by_crop/:crop_id
        def by_crop
          crop_id = params[:crop_id]
          harvests = current_user.harvests
                                .where(crop_id: crop_id)
                                .includes(:field, :farm_activity)
                                .order(harvest_date: :desc)

          render json: {
            message: "Harvests for crop retrieved successfully",
            data: harvests.map { |h| harvest_response(h) }
          }
        end

        # GET /api/v1/harvests/by_field/:field_id
        def by_field
          field_id = params[:field_id]
          harvests = current_user.harvests
                                .where(field_id: field_id)
                                .includes(:crop_animal, :farm_activity)
                                .order(harvest_date: :desc)

          render json: {
            message: "Harvests for field retrieved successfully",
            data: harvests.map { |h| harvest_response(h) }
          }
        end

        # GET /api/v1/harvests/stats
        def stats
          # Thống kê sản lượng thu hoạch theo thời gian
          monthly_stats = current_user.harvests
                                    .group("DATE_FORMAT(harvest_date, '%Y-%m')")
                                    .sum(:quantity)

          # Thống kê theo cây trồng
          crop_stats = current_user.harvests
                                  .joins(:crop_animal)
                                  .group("crop_animals.name")
                                  .sum(:quantity)

          # Thống kê theo cánh đồng
          field_stats = current_user.harvests
                                  .joins(:field)
                                  .group("fields.name")
                                  .sum(:quantity)

          render json: {
            message: "Harvest statistics retrieved successfully",
            data: {
              monthly: monthly_stats,
              by_crop: crop_stats,
              by_field: field_stats,
              total_quantity: current_user.harvests.sum(:quantity),
              harvest_count: current_user.harvests.count
            }
          }
        end

        private

        def set_harvest
          @harvest = current_user.harvests.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Harvest not found" }, status: :not_found
        end

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

        def harvest_response(harvest)
          {
            id: harvest.id,
            quantity: harvest.quantity,
            harvest_date: harvest.harvest_date,
            area: harvest.calculate_area,
            crop: {
              id: harvest.crop_animal.id,
              name: harvest.crop_animal.name,
              crop_type: harvest.crop_animal.crop_type
            },
            field: harvest.field.present? ? {
              id: harvest.field.id,
              name: harvest.field.name,
              area: harvest.field.area
            } : nil,
            farm_activity: harvest.farm_activity.present? ? {
              id: harvest.farm_activity.id,
              activity_type: harvest.farm_activity.activity_type,
              status: harvest.farm_activity.status
            } : nil,
            coordinates: harvest.coordinates,
            created_at: harvest.created_at,
            updated_at: harvest.updated_at
          }
        end
      end
    end
  end
end
