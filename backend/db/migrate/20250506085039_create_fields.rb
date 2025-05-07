class CreateFields < ActiveRecord::Migration[8.0]
  def change
    create_table :fields do |t|
      t.string :name, null: false
      t.references :user, null: false, foreign_key: { to_table: :users, primary_key: :user_id }
      t.json :coordinates # Lưu tọa độ đa giác
      t.decimal :area, precision: 10, scale: 2 # Diện tích (m2)
      t.string :description
      t.string :location # Địa điểm mô tả
      t.timestamps
    end
  end
end
