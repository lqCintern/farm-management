class ConvertCropAnimalsToPineappleCrops < ActiveRecord::Migration[8.0]
  def change
    # 1. Đổi tên bảng để phản ánh mục đích sử dụng mới
    rename_table :crop_animals, :pineapple_crops
    
    # 2. Thêm các trường đặc thù cho quy trình trồng dứa
    add_column :pineapple_crops, :season_type, :string, comment: "Vụ: Xuân-Hè hoặc Thu-Đông"
    add_column :pineapple_crops, :planting_density, :integer, comment: "Mật độ trồng (cây/ha)"
    
    # 3. Các mốc thời gian quan trọng trong chu kỳ sinh trưởng
    add_column :pineapple_crops, :land_preparation_date, :date, comment: "Ngày chuẩn bị đất"
    add_column :pineapple_crops, :expected_flower_date, :date, comment: "Ngày dự kiến ra hoa"
    add_column :pineapple_crops, :actual_flower_date, :date, comment: "Ngày thực tế ra hoa"
    
    # 4. Thông tin giai đoạn hiện tại
    add_column :pineapple_crops, :current_stage, :integer, default: 0, comment: "Giai đoạn hiện tại: 0-Chuẩn bị, 1-Trồng, 2-Chăm sóc, etc."
    add_column :pineapple_crops, :current_stage_start_date, :date, comment: "Ngày bắt đầu giai đoạn hiện tại"
    
    # 5. Thông tin phân bón và xử lý
    add_column :pineapple_crops, :fertilizer_schedule, :json, comment: "Lịch bón phân"
    add_column :pineapple_crops, :flower_treatment_date, :date, comment: "Ngày xử lý ra hoa"
    add_column :pineapple_crops, :tie_date, :date, comment: "Ngày buộc lá (áp dụng vụ Xuân-Hè)"
    
    # 6. Thông tin thu hoạch
    add_column :pineapple_crops, :expected_yield, :decimal, precision: 10, scale: 2, comment: "Sản lượng dự kiến (kg)"
    add_column :pineapple_crops, :actual_yield, :decimal, precision: 10, scale: 2, comment: "Sản lượng thực tế (kg)"
    
    # 7. Chỉ số theo dõi
    add_column :pineapple_crops, :completion_percentage, :decimal, precision: 5, scale: 2, default: 0, comment: "Phần trăm hoàn thành chu kỳ"
    
    # 8. Đặt lại giá trị mặc định cho crop_type
    change_column_default :pineapple_crops, :crop_type, 0  # Giả sử 0 tương ứng với "pineapple"
    
    # 9. Thêm các chỉ số
    add_index :pineapple_crops, :season_type
    add_index :pineapple_crops, :current_stage
    add_index :pineapple_crops, :planting_date
    add_index :pineapple_crops, :harvest_date
  end
end
