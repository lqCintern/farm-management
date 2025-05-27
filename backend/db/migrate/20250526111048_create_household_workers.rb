class CreateHouseholdWorkers < ActiveRecord::Migration[8.0]
  def change
    create_table :household_workers do |t|
      t.bigint :household_id, null: false
      t.bigint :worker_id, null: false
      t.string :relationship
      t.boolean :is_active, default: true
      t.date :joined_date
      t.text :notes
      t.timestamps
      
      t.index [:household_id], name: "index_household_workers_on_household_id"
      t.index [:worker_id], name: "index_household_workers_on_worker_id", unique: true
    end
    
    add_foreign_key :household_workers, :farm_households, column: :household_id
    add_foreign_key :household_workers, :users, column: :worker_id, primary_key: :user_id
  end
end
