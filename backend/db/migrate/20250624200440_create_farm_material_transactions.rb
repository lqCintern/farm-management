class CreateFarmMaterialTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :farm_material_transactions do |t|
      t.references :farm_material, null: false, foreign_key: true
      t.bigint :user_id, null: false
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.decimal :unit_price, precision: 10, scale: 2, null: false
      t.decimal :total_price, precision: 10, scale: 2, null: false
      t.string :transaction_type, null: false # purchase, adjustment, consumption
      t.references :source, polymorphic: true # supply_order, farm_activity
      t.text :notes
      t.timestamps
    end
    
    add_index :farm_material_transactions, :user_id
    add_index :farm_material_transactions, :transaction_type
  end
end
