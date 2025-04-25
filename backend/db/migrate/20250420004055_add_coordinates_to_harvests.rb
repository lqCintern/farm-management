class AddCoordinatesToHarvests < ActiveRecord::Migration[8.0]
  def change
    add_column :harvests, :coordinates, :json
  end
end
