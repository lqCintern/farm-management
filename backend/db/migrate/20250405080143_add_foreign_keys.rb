class AddForeignKeys < ActiveRecord::Migration[8.0]
  def change
    # Bảng members
    add_foreign_key :members, :users, column: :user_id
    add_foreign_key :members, :cooperatives, column: :coop_id

    # Bảng farm_materials
    add_foreign_key :farm_materials, :users, column: :user_id
    add_foreign_key :farm_materials, :product_materials, column: :material_id

    # Bảng products_materials
    add_foreign_key :product_materials, :users, column: :supplier_id

    # Bảng transactions
    add_foreign_key :transactions, :users, column: :user_id

    # Bảng sales
    add_foreign_key :sales, :users, column: :user_id
    add_foreign_key :sales, :crops_animals, column: :crop_id

    # Bảng materials_purchase
    add_foreign_key :materials_purchase, :users, column: :user_id
    add_foreign_key :materials_purchase, :product_materials, column: :supply_id

    # Bảng harvest
    add_foreign_key :harvest, :users, column: :user_id
    add_foreign_key :harvest, :crops_animals, column: :crop_id

    # Bảng farm_activities
    add_foreign_key :farm_activities, :crops_animals, column: :crop_animal_id

    # Bảng cooperative
    add_foreign_key :cooperatives, :users, column: :leader_id
  end
end
