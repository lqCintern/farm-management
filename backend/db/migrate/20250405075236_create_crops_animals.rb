class CreateCropsAnimals < ActiveRecord::Migration[8.0]
  def change
    create_table :crops_animals do |t|
      t.integer :type, null: false
      t.string :name, null: false, limit: 255
      t.integer :area
      t.date :start_date
      t.date :end_date
      t.timestamps
    end
  end
end