class ImproveMaterialsPurchasesToSupplyOrders < ActiveRecord::Migration[8.0]
  def change
    # Kiểm tra nếu bảng supply_orders chưa tồn tại và materials_purchases tồn tại
    if !table_exists?(:supply_orders) && table_exists?(:materials_purchases)
      rename_table :materials_purchases, :supply_orders
    end
    
    # Kiểm tra và thay đổi kiểu dữ liệu của supply_listing_id nếu nó có kiểu không phải bigint
    if table_exists?(:supply_orders) && column_exists?(:supply_orders, :supply_listing_id)
      # Lấy thông tin kiểu dữ liệu của cột supply_listing_id
      column_type = connection.columns(:supply_orders).find { |c| c.name == 'supply_listing_id' }.type
      
      # Nếu không phải bigint, thay đổi kiểu dữ liệu
      unless column_type.to_s == 'bigint'
        change_column :supply_orders, :supply_listing_id, :bigint
      end
    end
    
    # Thêm các cột mới nếu chưa tồn tại
    change_table :supply_orders do |t|
      t.integer :status, default: 0 unless column_exists?(:supply_orders, :status)
      t.text :note unless column_exists?(:supply_orders, :note)
      t.text :rejection_reason unless column_exists?(:supply_orders, :rejection_reason)
      t.string :delivery_province unless column_exists?(:supply_orders, :delivery_province)
      t.string :delivery_district unless column_exists?(:supply_orders, :delivery_district)
      t.string :delivery_ward unless column_exists?(:supply_orders, :delivery_ward)
      t.string :delivery_address unless column_exists?(:supply_orders, :delivery_address)
      t.string :contact_phone unless column_exists?(:supply_orders, :contact_phone)
      t.integer :payment_method, default: 0 unless column_exists?(:supply_orders, :payment_method)
      t.boolean :is_paid, default: false unless column_exists?(:supply_orders, :is_paid)
    end
    
    # Thêm các index
    add_index :supply_orders, :supply_listing_id unless index_exists?(:supply_orders, :supply_listing_id)
    add_index :supply_orders, :user_id unless index_exists?(:supply_orders, :user_id)
    add_index :supply_orders, :status unless index_exists?(:supply_orders, :status)
    
    # Thêm foreign keys nếu chưa tồn tại
    unless foreign_key_exists?(:supply_orders, column: :supply_listing_id)
      begin
        # Đảm bảo rằng cột supply_listing_id có kiểu dữ liệu bigint trước khi thêm foreign key
        unless connection.columns(:supply_orders).find { |c| c.name == 'supply_listing_id' }.type.to_s == 'bigint'
          change_column :supply_orders, :supply_listing_id, :bigint
        end
        
        add_foreign_key :supply_orders, :supply_listings
      rescue => e
        puts "Lỗi khi thêm foreign key supply_listing_id: #{e.message}"
      end
    end
    
    unless foreign_key_exists?(:supply_orders, column: :user_id)
      begin
        add_foreign_key :supply_orders, :users, column: :user_id, primary_key: :user_id
      rescue => e
        puts "Lỗi khi thêm foreign key user_id: #{e.message}"
      end
    end
  end
end
