class CreateMarketplaceHarvests < ActiveRecord::Migration[8.0]
  def change
    create_table :marketplace_harvests do |t|
      t.references :product_listing, null: false, foreign_key: true
      t.references :product_order, foreign_key: true
      t.bigint :trader_id, null: false
      t.datetime :scheduled_date, null: false
      t.string :location, null: false
      t.text :notes
      t.decimal :estimated_quantity
      t.decimal :actual_quantity
      t.decimal :estimated_price
      t.decimal :final_price
      t.integer :status, default: 0
      t.datetime :payment_date

      t.timestamps
    end

    add_foreign_key :marketplace_harvests, :users, column: :trader_id, primary_key: :user_id

    # Thêm index cho tìm kiếm nhanh
    add_index :marketplace_harvests, :trader_id
    add_index :marketplace_harvests, :status
  end
end
