class CreateFarmHouseholds < ActiveRecord::Migration[8.0]
  def change
    create_table :farm_households do |t|
      t.string :name, null: false
      t.bigint :owner_id, null: false
      t.text :description
      t.string :province
      t.string :district
      t.string :ward
      t.string :address
      t.timestamps

      t.index [ :owner_id ], name: "index_farm_households_on_owner_id"
    end

    add_foreign_key :farm_households, :users, column: :owner_id, primary_key: :user_id
  end
end
