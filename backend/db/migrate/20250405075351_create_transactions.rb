class CreateTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :transactions do |t|
      t.integer :user_id, null: false
      t.integer :type
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.text :description
      t.timestamp :date, null: false
      t.timestamps
    end
  end
end