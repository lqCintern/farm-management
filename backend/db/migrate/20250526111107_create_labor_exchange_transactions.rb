class CreateLaborExchangeTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :labor_exchange_transactions do |t|
      t.bigint :labor_exchange_id, null: false
      t.bigint :labor_assignment_id, null: false
      t.decimal :hours, precision: 5, scale: 2
      t.text :description
      t.timestamps

      t.index [ :labor_exchange_id ], name: "index_labor_exchange_transactions_on_labor_exchange_id"
      t.index [ :labor_assignment_id ], name: "idx_labor_exchange_transactions_on_assignment_id"
    end

    add_foreign_key :labor_exchange_transactions, :labor_exchanges, column: :labor_exchange_id
    add_foreign_key :labor_exchange_transactions, :labor_assignments, column: :labor_assignment_id
  end
end
