class CreateConversations < ActiveRecord::Migration[8.0]
  def change
    create_table :conversations do |t|
      t.references :product_listing, foreign_key: true
      t.references :sender, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      t.references :receiver, null: false, foreign_key: { to_table: :users, primary_key: :user_id }

      t.timestamps
    end

    # Đảm bảo không có hội thoại trùng lặp giữa cùng 2 user về cùng sản phẩm
    add_index :conversations, [ :product_listing_id, :sender_id, :receiver_id ], unique: true, name: 'idx_unique_conversations'
  end
end
