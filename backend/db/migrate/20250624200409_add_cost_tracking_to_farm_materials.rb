class AddCostTrackingToFarmMaterials < ActiveRecord::Migration[8.0]
  def change
    add_column :farm_materials, :unit_cost, :decimal, precision: 10, scale: 2, default: 0
    add_column :farm_materials, :total_cost, :decimal, precision: 10, scale: 2, default: 0
  end
end
