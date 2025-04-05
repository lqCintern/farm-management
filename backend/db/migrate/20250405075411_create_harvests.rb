class CreateHarvests < ActiveRecord::Migration[8.0]
  def change
    create_table :harvests do |t|
      t.integer :user_id, null: false
      t.integer :crop_id, null: false
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.timestamp :harvest_date, null: false
      t.timestamps
    end
  end
end