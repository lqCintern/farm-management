class CreateLaborRequests < ActiveRecord::Migration[8.0]
  def change
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

      t.index [ :requesting_household_id ], name: "index_labor_requests_on_requesting_household_id"
      t.index [ :providing_household_id ], name: "index_labor_requests_on_providing_household_id"
      t.index [ :farm_activity_id ], name: "index_labor_requests_on_farm_activity_id"
    end

    add_foreign_key :labor_requests, :farm_households, column: :requesting_household_id
    add_foreign_key :labor_requests, :farm_households, column: :providing_household_id
    add_foreign_key :labor_requests, :farm_activities, column: :farm_activity_id
  end
end
