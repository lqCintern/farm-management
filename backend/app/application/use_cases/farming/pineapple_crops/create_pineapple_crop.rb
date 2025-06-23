module UseCases::Farming
  module PineappleCrops
    class CreatePineappleCrop
      def initialize(pineapple_crop_repository, plan_generator_service)
        @pineapple_crop_repository = pineapple_crop_repository
        @plan_generator_service = plan_generator_service
      end

      def execute(attributes)
        # Kiểm tra field_id
        if attributes[:field_id].present?
          existing_crop = @pineapple_crop_repository.find_by_field_id_and_status(
            attributes[:field_id], "active"
          )
          if existing_crop
            return {
              success: false,
              error: "Thửa ruộng này đã có vụ trồng dứa đang hoạt động"
            }
          end
        end

        # Tạo vụ trồng dứa mới
        result = @pineapple_crop_repository.create(attributes)

        # Xử lý kết quả tạo
        if result.is_a?(Entities::Farming::PineappleCrop)
          crop = result

          # Tính toán các ngày quan trọng
          dates_result = @pineapple_crop_repository.calculate_key_dates(crop)

          if dates_result[:success] && crop.planting_date.present?
            # Tạo kế hoạch giai đoạn
            generate_stage_plan(crop)
          end

          { success: true, pineapple_crop: crop }
        else
          { success: false, errors: result[:errors] || [ "Không thể tạo vụ trồng dứa" ] }
        end
      end

      private

      def generate_stage_plan(crop)
        return unless crop.planting_date && crop.id

        # Sử dụng PlanGeneratorService để tạo danh sách hoạt động
        activities = @plan_generator_service.generate_activities_for_crop(crop)

        # Gọi repository với đầy đủ tham số (id và activities)
        @pineapple_crop_repository.generate_plan(crop.id, activities)
      end
    end
  end
end
