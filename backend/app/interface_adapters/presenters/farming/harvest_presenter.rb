module Presenters::Farming
  class HarvestPresenter
    def self.as_json(harvest)
      return {} unless harvest

      {
        id: harvest.id,
        quantity: harvest.quantity,
        harvest_date: harvest.harvest_date,
        area: harvest.area,
        crop: harvest.pineapple_crop,
        field: harvest.field,
        farm_activity: harvest.farm_activity,
        coordinates: harvest.coordinates,
        created_at: harvest.created_at,
        updated_at: harvest.updated_at
      }
    end

    def self.collection_as_json(harvests)
      harvests.map { |harvest| as_json(harvest) }
    end
  end
end
