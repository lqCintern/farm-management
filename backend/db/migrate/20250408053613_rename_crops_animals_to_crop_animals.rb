class RenameCropsAnimalsToCropAnimals < ActiveRecord::Migration[8.0]
  def change
    rename_table :crops_animals, :crop_animals
  end
end
