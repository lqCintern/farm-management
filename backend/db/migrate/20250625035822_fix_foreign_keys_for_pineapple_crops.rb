class FixForeignKeysForPineappleCrops < ActiveRecord::Migration[8.0]
  def up
    # Remove the old foreign key constraints that point to the non-existent crops_animals table
    remove_foreign_key :sales, :crops_animals, column: :crop_id, if_exists: true
    remove_foreign_key :harvests, :crops_animals, column: :crop_id, if_exists: true
    remove_foreign_key :farm_activities, :crops_animals, column: :crop_animal_id, if_exists: true
    
    # Xóa thủ công foreign key nếu còn tồn tại (tránh lỗi duplicate)
    execute "ALTER TABLE sales DROP FOREIGN KEY fk_rails_aeb51deac7;" rescue nil
    execute "ALTER TABLE harvests DROP FOREIGN KEY fk_rails_ff578d0966;" rescue nil
    
    # Đổi kiểu các cột liên quan sang bigint
    change_column_null :sales, :crop_id, true
    change_column :sales, :crop_id, :bigint
    change_column :harvests, :crop_id, :bigint
    change_column :farm_activities, :crop_animal_id, :bigint
    
    # Add new foreign key constraints that point to the pineapple_crops table
    add_foreign_key :sales, :pineapple_crops, column: :crop_id, on_delete: :nullify
    add_foreign_key :harvests, :pineapple_crops, column: :crop_id, on_delete: :cascade
    add_foreign_key :farm_activities, :pineapple_crops, column: :crop_animal_id, on_delete: :cascade
  end

  def down
    # Remove the new foreign key constraints
    remove_foreign_key :sales, :pineapple_crops, column: :crop_id, if_exists: true
    remove_foreign_key :harvests, :pineapple_crops, column: :crop_id, if_exists: true
    remove_foreign_key :farm_activities, :pineapple_crops, column: :crop_animal_id, if_exists: true
    
    # Make crop_id NOT NULL again in sales table
    change_column_null :sales, :crop_id, false
    
    # Restore the old foreign key constraints (if needed)
    add_foreign_key :sales, :crops_animals, column: :crop_id, if_exists: true
    add_foreign_key :harvests, :crops_animals, column: :crop_id, if_exists: true
    add_foreign_key :farm_activities, :crops_animals, column: :crop_animal_id, if_exists: true
  end
end
