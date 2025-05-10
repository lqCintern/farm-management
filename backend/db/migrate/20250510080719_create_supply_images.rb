class CreateSupplyImages < ActiveRecord::Migration[8.0]
  def change
    create_table :supply_images do |t|
      t.bigint :supply_listing_id, null: false
      t.integer :position, default: 0
      t.timestamps
    end
    
    add_index :supply_images, :supply_listing_id
    add_index :supply_images, [:supply_listing_id, :position]
    
    add_foreign_key :supply_images, :supply_listings
  end
end
