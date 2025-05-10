class CreateSupplierReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :supplier_reviews do |t|
      t.bigint :supply_listing_id, null: false
      t.bigint :supply_order_id, null: false
      t.bigint :reviewer_id, null: false
      t.bigint :supplier_id, null: false
      t.integer :rating, null: false
      t.text :content
      t.timestamps
    end
    
    add_index :supplier_reviews, :supply_listing_id
    add_index :supplier_reviews, :supply_order_id
    add_index :supplier_reviews, :reviewer_id
    add_index :supplier_reviews, :supplier_id
    
    add_foreign_key :supplier_reviews, :supply_listings
    add_foreign_key :supplier_reviews, :supply_orders
    add_foreign_key :supplier_reviews, :users, column: :reviewer_id, primary_key: :user_id
    add_foreign_key :supplier_reviews, :users, column: :supplier_id, primary_key: :user_id
  end
end
