class AddFieldsToFarmMaterials < ActiveRecord::Migration[6.1]
  def change
    add_column :farm_materials, :unit, :string
    add_column :farm_materials, :category, :integer, default: 4 # default là 'other'
  end
end
