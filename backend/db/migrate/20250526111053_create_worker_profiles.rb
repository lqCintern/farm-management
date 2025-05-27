class CreateWorkerProfiles < ActiveRecord::Migration[8.0]
  def change
    create_table :worker_profiles do |t|
      t.bigint :user_id, null: false
      t.text :skills
      t.decimal :daily_rate, precision: 10, scale: 2
      t.decimal :hourly_rate, precision: 10, scale: 2
      t.integer :availability, default: 0
      t.timestamps
      
      t.index [:user_id], name: "index_worker_profiles_on_user_id", unique: true
    end
    
    add_foreign_key :worker_profiles, :users, column: :user_id, primary_key: :user_id
  end
end
