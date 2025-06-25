module Repositories
  module Farming
    class PineappleCropRepository
      def find(id)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        map_to_entity(record) if record
      end

      def find_with_activities(id)
        record = ::Models::Farming::PineappleCrop.includes(:farm_activities, :user, :field).find_by(id: id)
        map_to_entity(record, true) if record
      end

      def find_by_user_id(user_id, filters = {})
        query = ::Models::Farming::PineappleCrop.where(user_id: user_id)

        query = query.where(season_type: filters[:season_type]) if filters[:season_type].present?
        query = query.where(field_id: filters[:field_id]) if filters[:field_id].present?
        query = query.where(status: filters[:status]) if filters[:status].present?
        query = query.where(current_stage: filters[:stage]) if filters[:stage].present?

        query.order(created_at: :desc)
      end

      def find_by_field_id_and_status(field_id, status)
        record = ::Models::Farming::PineappleCrop.find_by(field_id: field_id, status: status)
        map_to_entity(record) if record
      end

      def create(attributes)
        record = ::Models::Farming::PineappleCrop.new(
          name: attributes[:name],
          user_id: attributes[:user_id],
          field_id: attributes[:field_id],
          planting_date: attributes[:planting_date],
          harvest_date: attributes[:harvest_date],
          land_preparation_date: attributes[:land_preparation_date],
          tie_date: attributes[:tie_date],
          flower_treatment_date: attributes[:flower_treatment_date],
          expected_flower_date: attributes[:expected_flower_date],
          field_area: attributes[:field_area],
          season_type: attributes[:season_type],
          planting_density: attributes[:planting_density],
          status: attributes[:status] || "planning",
          description: attributes[:description],
          variety: attributes[:variety],
          source: attributes[:source],
          current_stage: attributes[:current_stage] || "preparation",
          current_stage_start_date: attributes[:current_stage_start_date] || Date.today,
          expected_yield: attributes[:expected_yield],
          actual_yield: attributes[:actual_yield] || 0,
          location: attributes[:location]
        )

        if record.save
          map_to_entity(record)
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def update(id, attributes)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        if record.update(attributes)
          { success: true, pineapple_crop: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def delete(id)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return false unless record

        record.destroy
      end

      def advance_stage(id)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        if record.advance_to_next_stage
          { success: true, pineapple_crop: map_to_entity(record) }
        else
          { success: false, error: "Không thể chuyển giai đoạn" }
        end
      end

      def record_harvest(id, quantity)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        return { success: false, error: "Vụ trồng chưa đến giai đoạn thu hoạch" } unless record.current_stage == "harvesting"

        current_yield = record.actual_yield || 0
        if record.update(actual_yield: current_yield + quantity)
          # Kiểm tra nếu đã thu hoạch xong
          if record.actual_yield >= record.expected_yield
            record.advance_to_next_stage # Chuyển sang giai đoạn tiếp theo
          end

          # Tạo bản ghi thu hoạch
          ::Farming::Harvest.create(
            user_id: record.user_id,
            crop_id: record.id,
            quantity: quantity,
            harvest_date: Time.current,
            field_id: record.field_id
          )

          { success: true, pineapple_crop: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def get_statistics(user_id)
        {
          total_crops: ::Models::Farming::PineappleCrop.where(user_id: user_id).count,
          active_crops: ::Models::Farming::PineappleCrop.where(user_id: user_id, status: "active").count,
          harvested_crops: ::Models::Farming::PineappleCrop.where(user_id: user_id, status: "harvested").count,
          by_season: {
            spring_summer: ::Models::Farming::PineappleCrop.where(user_id: user_id, season_type: "Xuân-Hè").count,
            fall_winter: ::Models::Farming::PineappleCrop.where(user_id: user_id, season_type: "Thu-Đông").count
          },
          by_stage: ::Models::Farming::PineappleCrop.current_stages.keys.map { |stage|
            { stage: stage, count: ::Models::Farming::PineappleCrop.where(user_id: user_id, current_stage: stage).count }
          },
          upcoming_harvests: ::Models::Farming::PineappleCrop.where(user_id: user_id)
                             .where("harvest_date >= ? AND harvest_date <= ?", Date.today, 3.months.from_now).count
        }
      end

      def calculate_key_dates(crop)
        record = ::Models::Farming::PineappleCrop.find_by(id: crop.id)
        return false unless record && record.planting_date.present?

        planting_date = record.planting_date
        season_type = record.season_type

        # Chuẩn bị đất (trước trồng 1 tháng)
        land_preparation_date = planting_date - 1.month

        # Ngày thu hoạch nếu chưa có
        harvest_date = record.harvest_date || (planting_date + 18.months)

        # Các mốc khác dựa theo mùa vụ
        tie_date = nil
        flower_treatment_date = nil
        expected_flower_date = nil

        case season_type
        when "Xuân-Hè"
          tie_date = planting_date + 5.months # Buộc lá sau 4-5 tháng
          flower_treatment_date = planting_date + 10.months
          expected_flower_date = planting_date + 12.months # Sau trồng 10-12 tháng
        when "Thu-Đông"
          flower_treatment_date = planting_date + 10.months
          expected_flower_date = planting_date + 12.months # Sau trồng 10-12 tháng
        else
          tie_date = planting_date + 5.months
          flower_treatment_date = planting_date + 10.months
          expected_flower_date = planting_date + 12.months
        end

        # Cập nhật các mốc thời gian
        update_params = {
          land_preparation_date: record.land_preparation_date || land_preparation_date,
          tie_date: record.tie_date || tie_date,
          expected_flower_date: record.expected_flower_date || expected_flower_date,
          flower_treatment_date: record.flower_treatment_date || flower_treatment_date,
          harvest_date: record.harvest_date || harvest_date
        }

        if record.update(update_params)
          { success: true, pineapple_crop: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end

      def generate_plan(id, activities)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        begin
          ActiveRecord::Base.transaction do
            # Xóa tất cả hoạt động đang chờ hoặc đang thực hiện
            record.farm_activities.where(status: [ :pending, :in_progress ]).destroy_all

            # Tạo các hoạt động mới được truyền vào
            activities.each do |activity_attrs|
              ::Farming::FarmActivity.create!(
                crop_animal_id: record.id,
                user_id: record.user_id,
                **activity_attrs
              )
            end
          end

          {
            success: true,
            pineapple_crop: map_to_entity(record, true),
            message: "Đã tạo kế hoạch trồng dứa thành công"
          }
        rescue => e
          { success: false, error: "Lỗi: #{e.message}" }
        end
      end

      def preview_plan(attributes)
        begin
          service = ::Services::Farming::PlanGeneratorService.new
          activities_data = service.preview_activities_for_params(attributes)

          activities_entities = activities_data.map do |act|
            # Tìm template tương ứng để lấy thông tin vật tư
            template = ::Models::Farming::PineappleActivityTemplate.find_by(
              activity_type: act[:activity_type],
              stage: act[:stage]
            )
            
            # Lấy thông tin vật tư nếu có template
            materials = []
            if template
              materials = template.template_activity_materials.includes(:farm_material).map do |tam|
                {
                  id: tam.farm_material.id,
                  name: tam.farm_material.name,
                  quantity: tam.quantity,
                  unit: tam.farm_material.unit
                }
              end
            end
            
            Entities::Farming::FarmActivity.new(
              activity_type: act[:activity_type],
              description: act[:description],
              start_date: act[:start_date],
              end_date: act[:end_date],
              frequency: act[:frequency] || 0,
              status: act[:status] || :pending,
              field_id: act[:field_id] || attributes[:field_id],
              materials: materials
            )
          end

          { success: true, activities: activities_entities }
        rescue => e
          { success: false, error: "Lỗi khi tạo kế hoạch: #{e.message}" }
        end
      end

      def save_activities_plan(id, activities, user_id)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        created_activities = []

        begin
          ActiveRecord::Base.transaction do
            # Xóa hoạt động cũ đang chờ hoặc đang thực hiện
            record.farm_activities.where(status: [ :pending, :in_progress ]).destroy_all

            # Tạo hoạt động mới
            activities.each do |activity_attrs|
              # Thêm trạng thái mặc định nếu không có
              activity_attrs[:status] = "pending" unless activity_attrs[:status].present?

              activity = ::Models::Farming::FarmActivity.create!(
                crop_animal_id: record.id,
                user_id: user_id,
                **activity_attrs
              )

              created_activities << map_activity_to_entity(activity)
            end
          end

          {
            success: true,
            activities: created_activities,
            message: "Đã tạo kế hoạch công việc thành công"
          }
        rescue => e
          { success: false, error: "Lỗi khi lưu kế hoạch: #{e.message}" }
        end
      end

      def clean_and_regenerate(id, user_id)
        record = ::Models::Farming::PineappleCrop.find_by(id: id, user_id: user_id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        begin
          # Xóa tất cả hoạt động chưa hoàn thành
          record.farm_activities.where.not(status: :completed).destroy_all

          # Tạo lại kế hoạch sử dụng PlanGeneratorService mới
          service = ::Services::Farming::PlanGeneratorService.new
          activities = service.generate_activities_for_crop(map_to_entity(record))

          # Gọi generate_plan với đủ tham số
          result = generate_plan(id, activities)

          if result[:success]
            {
              success: true,
              message: "Đã dọn dẹp và tạo lại hoạt động thành công",
              pineapple_crop: result[:pineapple_crop]
            }
          else
            { success: false, error: result[:error] || "Không thể dọn dẹp và tạo lại hoạt động" }
          end
        rescue => e
          { success: false, error: "Lỗi: #{e.message}" }
        end
      end

      def map_to_entity(record, include_activities = false)
        return nil unless record

        activities = []
        if include_activities && record.farm_activities.present?
          activities = record.farm_activities.map { |activity| map_activity_to_entity(activity) }
        end

        Entities::Farming::PineappleCrop.new(
          id: record.id,
          name: record.name,
          user_id: record.user_id,
          field_id: record.field_id,
          planting_date: record.planting_date,
          harvest_date: record.harvest_date,
          land_preparation_date: record.land_preparation_date,
          tie_date: record.tie_date,
          flower_treatment_date: record.flower_treatment_date,
          expected_flower_date: record.expected_flower_date,
          field_area: record.field_area,
          season_type: record.season_type,
          planting_density: record.planting_density,
          status: record.status,
          description: record.description,
          variety: record.variety,
          source: record.source,
          current_stage: record.current_stage,
          current_stage_start_date: record.current_stage_start_date,
          completion_percentage: record.completion_percentage,
          expected_yield: record.expected_yield,
          actual_yield: record.actual_yield,
          location: record.location,
          created_at: record.created_at,
          updated_at: record.updated_at,
          farm_activities: activities
        )
      end

      private

      def map_activity_to_entity(activity)
        Entities::Farming::FarmActivity.new(
          id: activity.id,
          crop_animal_id: activity.crop_animal_id,
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          description: activity.description,
          start_date: activity.start_date,
          end_date: activity.end_date,
          frequency: activity.frequency,
          status: activity.status,
          field_id: activity.field_id,
          created_at: activity.created_at,
          updated_at: activity.updated_at
        )
      end
    end
  end
end
