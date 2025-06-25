class CreateTemplateActivityMaterials < ActiveRecord::Migration[8.0]
  def change
    create_table :template_activity_materials do |t|
      t.references :pineapple_activity_template, null: false, foreign_key: { to_table: :pineapple_activity_templates }
      t.references :farm_material, null: false, foreign_key: { to_table: :farm_materials }
      t.float :quantity, null: false
      t.timestamps
    end
  end
end
