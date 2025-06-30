class AddTotalWeightToProductOrders < ActiveRecord::Migration[8.0]
  def change
    add_column :product_orders, :total_weight, :decimal, precision: 10, scale: 2
  end
end 