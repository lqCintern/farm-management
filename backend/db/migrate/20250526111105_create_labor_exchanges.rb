class CreateLaborExchanges < ActiveRecord::Migration[8.0]
  def change
    create_table :labor_exchanges do |t|
      t.bigint :household_a_id, null: false
      t.bigint :household_b_id, null: false
      t.decimal :hours_balance, precision: 8, scale: 2, default: 0.0
      t.text :notes
      t.datetime :last_transaction_date
      t.timestamps
      
      t.index [:household_a_id, :household_b_id], name: "index_labor_exchanges_on_households", unique: true
    end
    
    add_foreign_key :labor_exchanges, :farm_households, column: :household_a_id
    add_foreign_key :labor_exchanges, :farm_households, column: :household_b_id
  end
end
