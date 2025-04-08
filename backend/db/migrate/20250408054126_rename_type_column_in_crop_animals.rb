class RenameTypeColumnInCropAnimals < ActiveRecord::Migration[8.0]
  def change
    rename_column :crop_animals, :type, :crop_type
  end
end
