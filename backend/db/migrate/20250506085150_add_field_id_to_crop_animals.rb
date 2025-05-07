class AddFieldIdToCropAnimals < ActiveRecord::Migration[8.0]
  def change
    add_reference :crop_animals, :field, null: true, foreign_key: true
  end
end
