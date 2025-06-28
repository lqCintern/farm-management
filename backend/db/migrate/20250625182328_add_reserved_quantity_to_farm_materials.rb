class AddReservedQuantityToFarmMaterials < ActiveRecord::Migration[8.0]
  def change
    add_column :farm_materials, :reserved_quantity, :decimal, precision: 10, scale: 2, default: 0.0
    add_column :farm_materials, :available_quantity, :virtual, type: :decimal, precision: 10, scale: 2, 
      as: "quantity - COALESCE(reserved_quantity, 0)", stored: true
  end
end
