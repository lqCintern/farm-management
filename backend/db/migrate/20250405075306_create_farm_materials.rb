class CreateFarmMaterials < ActiveRecord::Migration[8.0]
  def change
    create_table :farm_materials do |t|
      t.string :name, null: false, limit: 255
      t.integer :user_id, null: false
      t.integer :material_id, null: false
      t.decimal :quantity, null: false
      t.timestamp :last_updated, null: false
      t.timestamps
    end
  end
end