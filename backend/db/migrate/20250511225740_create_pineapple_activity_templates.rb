# Migration
class CreatePineappleActivityTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :pineapple_activity_templates do |t|
      t.string :name, null: false
      t.text :description
      t.integer :activity_type, null: false
      t.integer :stage, null: false   # Liên kết với current_stage trong PineappleCrop
      t.integer :day_offset           # Số ngày so với ngày bắt đầu giai đoạn
      t.integer :duration_days        # Thời gian thực hiện (ngày)
      t.string :season_specific       # Áp dụng cho vụ nào (Xuân-Hè, Thu-Đông, hoặc cả hai)
      t.boolean :is_required, default: true  # Có bắt buộc không
      t.references :user, null: true  # Nếu user_id = null thì đây là template mặc định

      t.timestamps
    end
  end
end
