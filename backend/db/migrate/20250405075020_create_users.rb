class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: false do |t|
      t.primary_key :user_id
      t.integer :user_type, null: false
      t.string :user_name, null: false, limit: 50
      t.string :email, null: false, limit: 255
      t.string :password_digest, null: false
      t.integer :status, null: false, default: 0
      t.string :fullname, limit: 255
      t.string :address, limit: 255
      t.string :phone, null: false, limit: 20
      t.timestamps
    end
  end
end