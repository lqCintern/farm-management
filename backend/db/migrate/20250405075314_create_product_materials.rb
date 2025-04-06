class CreateProductMaterials < ActiveRecord::Migration[8.0]
  def change
    create_table :product_materials do |t|
      t.string :name, limit: 255
      t.integer :supplier_id, null: false
      t.integer :category
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :unit, null: false, limit: 255
      t.decimal :stock, null: false
      t.timestamp :last_updated, null: false
      t.timestamps
    end
  end
end
