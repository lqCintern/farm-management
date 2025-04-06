class CreateFarmActivities < ActiveRecord::Migration[8.0]
  def change
    create_table :farm_activities do |t|
      t.integer :crop_animal_id
      t.integer :type, null: false
      t.string :description, limit: 255
      t.integer :frequency
      t.integer :status
      t.date :start_date
      t.date :end_date
      t.timestamps
    end
  end
end
