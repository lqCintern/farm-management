class CreateNotificationSystem < ActiveRecord::Migration[8.0]
  def up
    # Drop existing tables if they exist
    drop_table :notification_settings if table_exists?(:notification_settings)
    drop_table :notifications if table_exists?(:notifications)

    # Create new tables
    create_table :notifications do |t|
      t.bigint :recipient_id, null: false
      t.bigint :sender_id
      t.string :notifiable_type
      t.bigint :notifiable_id
      t.string :category, null: false
      t.string :event_type, null: false
      t.string :title, null: false
      t.text :message, null: false
      t.json :metadata
      t.datetime :read_at
      t.datetime :sent_via_email_at
      t.datetime :sent_via_push_at
      t.integer :priority, default: 1
      t.timestamps

      t.index [ :recipient_id, :read_at ]
      t.index [ :notifiable_type, :notifiable_id ]
      t.index :category
      t.index :event_type
      t.index :created_at
    end

    create_table :notification_settings do |t|
      t.bigint :user_id, null: false
      t.string :category, null: false
      t.string :event_type
      t.boolean :email_enabled, default: true
      t.boolean :push_enabled, default: true
      t.boolean :in_app_enabled, default: true
      t.timestamps

      t.index [ :user_id, :category, :event_type ], unique: true, name: 'unique_notification_setting'
    end

    # Add foreign keys with proper references
    add_foreign_key :notifications, :users, column: :recipient_id, primary_key: :user_id
    add_foreign_key :notifications, :users, column: :sender_id, on_delete: :nullify, primary_key: :user_id
    add_foreign_key :notification_settings, :users, column: :user_id, primary_key: :user_id
  end

  def down
    drop_table :notification_settings if table_exists?(:notification_settings)
    drop_table :notifications if table_exists?(:notifications)
  end
end
