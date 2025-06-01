class CreateActivityMaterials < ActiveRecord::Migration[6.1]
  def change
    create_table :activity_materials do |t|
      t.references :farm_activity, null: false, foreign_key: true
      t.references :farm_material, null: false, foreign_key: true
      t.float :planned_quantity, null: false
      t.float :actual_quantity
      t.timestamps
    end

    add_index :activity_materials, [ :farm_activity_id, :farm_material_id ], unique: true, name: 'idx_activity_materials_on_activity_and_material'
  end
end
