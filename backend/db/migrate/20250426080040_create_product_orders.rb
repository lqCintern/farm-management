class CreateProductOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :product_orders do |t|
      t.references :product_listing, null: false, foreign_key: true
      t.references :buyer, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      
      t.integer :status, default: 0  # 0: pending, 1: accepted, 2: rejected, 3: completed
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.decimal :price, precision: 10, scale: 2
      t.text :note
      t.text :rejection_reason
      
      t.timestamps
    end
    
    add_index :product_orders, :status
  end
end
