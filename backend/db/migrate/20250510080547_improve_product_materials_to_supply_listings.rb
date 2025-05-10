class ImproveProductMaterialsToSupplyListings < ActiveRecord::Migration[8.0]
  def change
    # Kiểm tra nếu bảng supply_listings chưa tồn tại và product_materials tồn tại
    if !table_exists?(:supply_listings) && table_exists?(:product_materials)
      rename_table :product_materials, :supply_listings
    end
    
    # Kiểm tra và thay đổi kiểu dữ liệu của user_id nếu nó có kiểu không phải bigint
    if table_exists?(:supply_listings) && column_exists?(:supply_listings, :user_id)
      # Lấy thông tin kiểu dữ liệu của cột user_id
      column_type = connection.columns(:supply_listings).find { |c| c.name == 'user_id' }.type
      
      # Nếu không phải bigint, thay đổi kiểu dữ liệu
      unless column_type.to_s == 'bigint'
        change_column :supply_listings, :user_id, :bigint
      end
    end
    
    # Thêm các cột mới nếu chưa tồn tại
    change_table :supply_listings do |t|
      # Chỉ thêm các cột nếu chưa tồn tại
      t.text :description unless column_exists?(:supply_listings, :description)
      t.integer :status, default: 1 unless column_exists?(:supply_listings, :status)
      t.string :brand unless column_exists?(:supply_listings, :brand)
      t.string :manufacturer unless column_exists?(:supply_listings, :manufacturer)
      t.date :manufacturing_date unless column_exists?(:supply_listings, :manufacturing_date)
      t.date :expiry_date unless column_exists?(:supply_listings, :expiry_date)
      t.string :province unless column_exists?(:supply_listings, :province)
      t.string :district unless column_exists?(:supply_listings, :district)
      t.string :ward unless column_exists?(:supply_listings, :ward)
      t.string :address unless column_exists?(:supply_listings, :address)
      t.integer :view_count, default: 0 unless column_exists?(:supply_listings, :view_count)
      t.integer :order_count, default: 0 unless column_exists?(:supply_listings, :order_count)
    end
    
    # Thêm các index nếu chưa có
    add_index :supply_listings, :category unless index_exists?(:supply_listings, :category)
    add_index :supply_listings, :status unless index_exists?(:supply_listings, :status)
    add_index :supply_listings, :province unless index_exists?(:supply_listings, :province)
    
    # Đổi tên các cột nếu các cột cũ tồn tại và cột mới chưa tồn tại
    if column_exists?(:supply_listings, :stock) && !column_exists?(:supply_listings, :quantity)
      rename_column :supply_listings, :stock, :quantity
    end
    
    if column_exists?(:supply_listings, :supplier_id) && !column_exists?(:supply_listings, :user_id)
      rename_column :supply_listings, :supplier_id, :user_id
    end
    
    # Thêm foreign key nếu chưa tồn tại
    unless foreign_key_exists?(:supply_listings, column: :user_id)
      begin
        add_foreign_key :supply_listings, :users, column: :user_id, primary_key: :user_id
      rescue => e
        puts "Lỗi khi thêm foreign key: #{e.message}"
      end
    end
  end
end
