class CreateProductImages < ActiveRecord::Migration[8.0]
  def change
    create_table :product_images do |t|
      t.references :product_listing, null: false, foreign_key: true
      t.string :image_path, null: false
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :product_images, [:product_listing_id, :position]
  end
end
