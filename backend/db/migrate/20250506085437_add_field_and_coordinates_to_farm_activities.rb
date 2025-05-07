class AddFieldAndCoordinatesToFarmActivities < ActiveRecord::Migration[8.0]
  def change
    add_reference :farm_activities, :field, null: true, foreign_key: true
    add_column :farm_activities, :coordinates, :json
  end
end
