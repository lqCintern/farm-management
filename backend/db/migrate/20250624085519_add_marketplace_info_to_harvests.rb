class AddMarketplaceInfoToHarvests < ActiveRecord::Migration[8.0]
  def change
    add_column :harvests, :marketplace_harvest_id, :bigint
    add_column :harvests, :is_marketplace_sale, :boolean, default: false
    add_column :harvests, :sale_price, :decimal, precision: 10, scale: 2
    
    add_index :harvests, :is_marketplace_sale
    add_index :harvests, :marketplace_harvest_id
  end
end
