class CreateActivityLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :activity_logs do |t|
      t.references :user, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      t.string :action_type, null: false
      t.string :target_type
      t.bigint :target_id
      t.json :details

      t.timestamps
    end

    add_index :activity_logs, [ :target_type, :target_id ]
    add_index :activity_logs, :action_type
  end
end
