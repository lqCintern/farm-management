class CreateProductListings < ActiveRecord::Migration[8.0]
  def change
    create_table :product_listings do |t|
      t.references :user, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      t.references :crop_animal, foreign_key: true

      # Thông tin cơ bản
      t.string :title, null: false
      t.text :description
      t.integer :status, default: 1, null: false  # 0: draft, 1: active, 2: sold, 3: hidden

      # Thông tin sản phẩm
      t.string :product_type, null: false  # Loại dứa: Queen, Cayenne, MD2
      t.integer :quantity                  # Số lượng quả
      t.decimal :total_weight, precision: 10, scale: 2  # Tổng trọng lượng (kg)
      t.decimal :average_size, precision: 10, scale: 2  # Kích thước trung bình (gram/quả)
      t.decimal :price_expectation, precision: 10, scale: 2  # Giá mong muốn

      # Thông tin vị trí
      t.string :province
      t.string :district
      t.string :ward
      t.string :address
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6

      # Thời gian thu hoạch
      t.date :harvest_start_date
      t.date :harvest_end_date

      # Thống kê
      t.integer :view_count, default: 0
      t.integer :message_count, default: 0
      t.integer :order_count, default: 0

      t.timestamps
    end

    add_index :product_listings, :status
    add_index :product_listings, :product_type
    add_index :product_listings, :province
    add_index :product_listings, [ :harvest_start_date, :harvest_end_date ]
  end
end
