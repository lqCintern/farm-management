class AddFarmActivityIdToMarketplaceHarvests < ActiveRecord::Migration[8.0]
  def change
    add_column :marketplace_harvests, :farm_activity_id, :bigint
    add_index :marketplace_harvests, :farm_activity_id
    add_foreign_key :marketplace_harvests, :farm_activities, column: :farm_activity_id
  end
end
