class AddLocationNoteToProductListings < ActiveRecord::Migration[8.0]
  def change
    add_column :product_listings, :location_note, :text
  end
end
