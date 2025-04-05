class CreateMembers < ActiveRecord::Migration[8.0]
  def change
    create_table :members do |t|
      t.integer :user_id, null: false
      t.integer :coop_id, null: false
      t.timestamp :join_date, null: false
      t.timestamps
    end
  end
end