module Presenters::Farming
  class HarvestPresenter < BasePresenter
    def as_json
      return {} unless @object

      {
        id: @object.id,
        quantity: @object.quantity,
        harvest_date: @object.harvest_date,
        area: @object.area,
        crop: @object.pineapple_crop,
        field: @object.field,
        farm_activity: @object.farm_activity,
        coordinates: @object.coordinates,
        created_at: @object.created_at,
        updated_at: @object.updated_at
      }
    end

    def self.collection_as_json(harvests)
      harvests.map { |harvest| new(harvest).as_json }
    end

    def self.format_response(result)
      if result[:success]
        {
          message: "Harvest #{result[:action]} successfully",
          data: new(result[:harvest]).as_json
        }
      else
        {
          error: result[:error],
          errors: result[:errors]
        }
      end
    end

    def self.format_statistics_response(result)
      if result[:success]
        {
          message: "Harvest statistics retrieved successfully",
          data: {
            monthly: result[:monthly],
            by_crop: result[:by_crop],
            by_field: result[:by_field],
            total_quantity: result[:total_quantity],
            harvest_count: result[:harvest_count],
            farming_harvests: result[:farming_harvests],
            marketplace_harvests: result[:marketplace_harvests],
            total_revenue: result[:total_revenue],
            farming_details: result[:farming_details],
            marketplace_details: result[:marketplace_details]
          }
        }
      else
        {
          error: "Không thể lấy thống kê thu hoạch"
        }
      end
    end
  end
end
