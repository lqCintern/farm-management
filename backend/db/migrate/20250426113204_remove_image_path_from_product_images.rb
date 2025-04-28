class RemoveImagePathFromProductImages < ActiveRecord::Migration[8.0]
  def change
    remove_column :product_images, :image_path, :string
  end
end
