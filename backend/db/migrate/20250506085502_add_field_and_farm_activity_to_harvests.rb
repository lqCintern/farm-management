class AddFieldAndFarmActivityToHarvests < ActiveRecord::Migration[8.0]
  def change
    add_reference :harvests, :field, null: true, foreign_key: true
    add_reference :harvests, :farm_activity, null: true, foreign_key: true
  end
end
