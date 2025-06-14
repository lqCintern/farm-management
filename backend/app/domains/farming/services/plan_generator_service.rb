module Farming
  class PlanGeneratorService
    def generate_activities_for_crop(crop_entity)
      # Logic để tạo danh sách hoạt động dựa trên crop
      planting_date = crop_entity.planting_date

      # Tạo các hoạt động cần thiết cho vụ trồng dứa
      [
        {
          activity_type: "soil_preparation",
          description: "Cày xới toàn bộ diện tích, làm tơi đất",
          start_date: (planting_date - 18.days),
          end_date: (planting_date - 15.days),
          field_id: crop_entity.field_id,
          status: :pending
        },
        {
          activity_type: "soil_preparation",
          description: "Cày lần 2, lên luống để chuẩn bị trồng",
          start_date: (planting_date - 8.days),
          end_date: (planting_date - 3.days),
          field_id: crop_entity.field_id,
          status: :pending
        },
        # Các hoạt động khác của quy trình trồng dứa...
        {
          activity_type: "planting",
          description: "Trồng chồi đúng kỹ thuật, đúng mật độ",
          start_date: planting_date,
          end_date: (planting_date + 2.days),
          field_id: crop_entity.field_id,
          status: :pending
        }
        # Thêm các hoạt động khác theo kế hoạch
      ]
    end

    def preview_activities_for_params(crop_params)
      # Logic tương tự như trên, nhưng làm việc với params
      planting_date = crop_params[:planting_date].is_a?(String) ?
                      Date.parse(crop_params[:planting_date]) : crop_params[:planting_date]

      field_id = crop_params[:field_id]

      # Danh sách hoạt động tương tự như trên
      [
        {
          activity_type: "soil_preparation",
          description: "Cày xới toàn bộ diện tích, làm tơi đất",
          start_date: (planting_date - 18.days),
          end_date: (planting_date - 15.days),
          field_id: field_id,
          status: :pending
        }
        # Các hoạt động khác...
      ]
    end
  end
end
