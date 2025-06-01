class UpdateCropAnimalsTable < ActiveRecord::Migration[8.0]
  def change
    # Kiểm tra và đổi tên các cột nếu chúng tồn tại
    if column_exists?(:crop_animals, :start_date)
      rename_column :crop_animals, :start_date, :planting_date
    end

    if column_exists?(:crop_animals, :end_date)
      rename_column :crop_animals, :end_date, :harvest_date
    end

    if column_exists?(:crop_animals, :area)
      rename_column :crop_animals, :area, :field_area
    end

    # Thêm các cột mới
    add_column :crop_animals, :status, :integer, default: 0, null: false
    add_column :crop_animals, :description, :text
    add_column :crop_animals, :location, :string
    add_column :crop_animals, :quantity, :integer
    add_column :crop_animals, :variety, :string
    add_column :crop_animals, :source, :string

    # Thêm các indexes
    add_index :crop_animals, [ :user_id, :crop_type ]
    add_index :crop_animals, [ :user_id, :status ]
  end
end
