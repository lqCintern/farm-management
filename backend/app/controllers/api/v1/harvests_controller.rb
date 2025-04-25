module Api
  module V1
    class HarvestsController < Api::BaseController
      def create
        harvest = current_user.harvests.new(harvest_params)
        if harvest.save
          render json: {
            message: "Harvest created successfully",
            data: {
              id: harvest.id,
              quantity: harvest.quantity,
              harvest_date: harvest.harvest_date,
              area: harvest.calculate_area, # Diện tích tính từ tọa độ
              coordinates: harvest.coordinates
            }
          }, status: :created
        else
          render json: { errors: harvest.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def harvest_params
        params.require(:harvest).permit(:quantity, :harvest_date, :crop_id, coordinates: [:lat, :lng])
      end
    end
  end
end
