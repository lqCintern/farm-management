class CreateMessages < ActiveRecord::Migration[8.0]
  def change
    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      t.text :content, null: false
      t.boolean :read, default: false

      t.timestamps
    end

    add_index :messages, [ :conversation_id, :created_at ]
    add_index :messages, [ :user_id, :read ]
  end
end
