class CreateSales < ActiveRecord::Migration[8.0]
  def change
    create_table :sales do |t|
      t.integer :user_id, null: false
      t.integer :crop_id, null: false
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.timestamp :sale_date, null: false
      t.timestamps
    end
  end
end
