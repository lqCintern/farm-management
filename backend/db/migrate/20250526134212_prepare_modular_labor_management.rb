class PrepareModularLaborManagement < ActiveRecord::Migration[8.0]
  def change
    # 1. Đổi tên bảng hiện có (nếu cần)
    # Nếu đã có bảng nhưng chưa có prefix 'labor_'
    rename_table :farm_households, :labor_farm_households if table_exists?(:farm_households)
    rename_table :household_workers, :labor_household_workers if table_exists?(:household_workers)
    rename_table :worker_profiles, :labor_worker_profiles if table_exists?(:worker_profiles)
    
    # 2. Tạo bảng mới nếu chưa có
    unless table_exists?(:labor_farm_households)
      create_table :labor_farm_households do |t|
        t.string :name, null: false
        t.bigint :owner_id, null: false
        t.text :description
        t.string :province
        t.string :district
        t.string :ward
        t.string :address
        t.timestamps
        
        t.index [:owner_id], name: "index_labor_farm_households_on_owner_id"
      end
    end
    
    unless table_exists?(:labor_household_workers)
      create_table :labor_household_workers do |t|
        t.bigint :household_id, null: false
        t.bigint :worker_id, null: false
        t.string :relationship
        t.boolean :is_active, default: true
        t.date :joined_date
        t.text :notes
        t.timestamps
        
        t.index [:household_id], name: "index_labor_household_workers_on_household_id"
        t.index [:worker_id], name: "index_labor_household_workers_on_worker_id", unique: true
      end
    end
    
    unless table_exists?(:labor_worker_profiles)
      create_table :labor_worker_profiles do |t|
        t.bigint :user_id, null: false
        t.text :skills
        t.decimal :daily_rate, precision: 10, scale: 2
        t.decimal :hourly_rate, precision: 10, scale: 2
        t.integer :availability, default: 0
        t.timestamps
        
        t.index [:user_id], name: "index_labor_worker_profiles_on_user_id", unique: true
      end
    end
    
    unless table_exists?(:labor_requests)
      create_table :labor_requests do |t|
        t.bigint :requesting_household_id, null: false
        t.bigint :providing_household_id
        t.bigint :farm_activity_id
        t.string :title, null: false
        t.text :description
        t.integer :workers_needed
        t.integer :request_type, default: 0
        t.decimal :rate, precision: 10, scale: 2
        t.date :start_date
        t.date :end_date
        t.time :start_time
        t.time :end_time
        t.integer :status, default: 0
        t.timestamps
        
        t.index [:requesting_household_id], name: "index_labor_requests_on_requesting_household_id"
        t.index [:providing_household_id], name: "index_labor_requests_on_providing_household_id"
        t.index [:farm_activity_id], name: "index_labor_requests_on_farm_activity_id"
      end
    end
    
    unless table_exists?(:labor_assignments)
      create_table :labor_assignments do |t|
        t.bigint :labor_request_id, null: false
        t.bigint :worker_id, null: false
        t.bigint :home_household_id, null: false
        t.date :work_date, null: false
        t.time :start_time
        t.time :end_time
        t.decimal :hours_worked, precision: 5, scale: 2
        t.integer :status, default: 0
        t.text :notes
        t.integer :worker_rating
        t.integer :farmer_rating
        t.timestamps
        
        t.index [:labor_request_id], name: "index_labor_assignments_on_labor_request_id"
        t.index [:worker_id], name: "index_labor_assignments_on_worker_id"
        t.index [:home_household_id], name: "index_labor_assignments_on_home_household_id"
        t.index [:work_date], name: "index_labor_assignments_on_work_date"
      end
    end
    
    unless table_exists?(:labor_exchanges)
      create_table :labor_exchanges do |t|
        t.bigint :household_a_id, null: false
        t.bigint :household_b_id, null: false
        t.decimal :hours_balance, precision: 8, scale: 2, default: 0.0
        t.text :notes
        t.datetime :last_transaction_date
        t.timestamps
        
        t.index [:household_a_id, :household_b_id], name: "index_labor_exchanges_on_households", unique: true
      end
    end
    
    unless table_exists?(:labor_exchange_transactions)
      create_table :labor_exchange_transactions do |t|
        t.bigint :labor_exchange_id, null: false
        t.bigint :labor_assignment_id, null: false
        t.decimal :hours, precision: 5, scale: 2
        t.text :description
        t.timestamps
        
        t.index [:labor_exchange_id], name: "index_labor_exchange_transactions_on_labor_exchange_id"
        t.index [:labor_assignment_id], name: "idx_labor_exchange_transactions_on_assignment_id"
      end
    end
    
    # 3. Tạo khóa ngoại
    # Chỉ thêm những khóa ngoại chưa có
    add_foreign_key :labor_farm_households, :users, column: :owner_id, primary_key: :user_id unless foreign_key_exists?(:labor_farm_households, :users)
    add_foreign_key :labor_household_workers, :labor_farm_households, column: :household_id unless foreign_key_exists?(:labor_household_workers, :labor_farm_households)
    add_foreign_key :labor_household_workers, :users, column: :worker_id, primary_key: :user_id unless foreign_key_exists?(:labor_household_workers, :users)
    add_foreign_key :labor_worker_profiles, :users, column: :user_id, primary_key: :user_id unless foreign_key_exists?(:labor_worker_profiles, :users)
    
    add_foreign_key :labor_requests, :labor_farm_households, column: :requesting_household_id unless foreign_key_exists?(:labor_requests, :labor_farm_households, column: :requesting_household_id)
    add_foreign_key :labor_requests, :labor_farm_households, column: :providing_household_id unless foreign_key_exists?(:labor_requests, :labor_farm_households, column: :providing_household_id)
    add_foreign_key :labor_requests, :farm_activities, column: :farm_activity_id unless foreign_key_exists?(:labor_requests, :farm_activities)
    
    add_foreign_key :labor_assignments, :labor_requests, column: :labor_request_id unless foreign_key_exists?(:labor_assignments, :labor_requests)
    add_foreign_key :labor_assignments, :users, column: :worker_id, primary_key: :user_id unless foreign_key_exists?(:labor_assignments, :users)
    add_foreign_key :labor_assignments, :labor_farm_households, column: :home_household_id unless foreign_key_exists?(:labor_assignments, :labor_farm_households, column: :home_household_id)
    
    add_foreign_key :labor_exchanges, :labor_farm_households, column: :household_a_id unless foreign_key_exists?(:labor_exchanges, :labor_farm_households, column: :household_a_id)
    add_foreign_key :labor_exchanges, :labor_farm_households, column: :household_b_id unless foreign_key_exists?(:labor_exchanges, :labor_farm_households, column: :household_b_id)
    
    add_foreign_key :labor_exchange_transactions, :labor_exchanges, column: :labor_exchange_id unless foreign_key_exists?(:labor_exchange_transactions, :labor_exchanges)
    add_foreign_key :labor_exchange_transactions, :labor_assignments, column: :labor_assignment_id unless foreign_key_exists?(:labor_exchange_transactions, :labor_assignments)
  end
  
  def foreign_key_exists?(from_table, to_table, options = {})
    foreign_keys(from_table).any? { |k| 
      k.to_table.to_s == to_table.to_s &&
      (options[:column].nil? || options[:column].to_s == k.column.to_s)
    }
  end
end
