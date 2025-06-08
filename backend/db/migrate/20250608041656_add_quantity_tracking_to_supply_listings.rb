class AddQuantityTrackingToSupplyListings < ActiveRecord::Migration[8.0]
  def change
    add_column :supply_listings, :pending_quantity, :decimal, precision: 10, scale: 2, default: 0
    add_column :supply_listings, :sold_quantity, :decimal, precision: 10, scale: 2, default: 0
  end
end
