class CreateLaborAssignments < ActiveRecord::Migration[8.0]
  def change
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

      t.index [ :labor_request_id ], name: "index_labor_assignments_on_labor_request_id"
      t.index [ :worker_id ], name: "index_labor_assignments_on_worker_id"
      t.index [ :home_household_id ], name: "index_labor_assignments_on_home_household_id"
      t.index [ :work_date ], name: "index_labor_assignments_on_work_date"
    end

    add_foreign_key :labor_assignments, :labor_requests, column: :labor_request_id
    add_foreign_key :labor_assignments, :users, column: :worker_id, primary_key: :user_id
    add_foreign_key :labor_assignments, :farm_households, column: :home_household_id
  end
end
