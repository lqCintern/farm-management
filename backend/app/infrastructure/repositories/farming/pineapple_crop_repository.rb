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
          
          # Thêm user_id vào attributes nếu có
          crop_params = attributes.dup
          user_id = nil
          field_area_ha = nil
          
          if attributes[:user_id].blank? && attributes[:field_id].present?
            # Tìm user_id và diện tích từ field
            field = ::Models::Farming::Field.find_by(id: attributes[:field_id])
            crop_params[:user_id] = field&.user_id
            user_id = field&.user_id
            # Tính diện tích theo ha (m² / 10000)
            field_area_ha = field&.area ? (field.area.to_f / 10000) : nil
          else
            user_id = attributes[:user_id]
            # Nếu có field_area trong attributes, sử dụng nó
            field_area_ha = attributes[:field_area] ? (attributes[:field_area].to_f / 10000) : nil
          end
          
          activities_data = service.preview_activities_for_params(crop_params)

          activities_entities = activities_data.map do |act|
            # Tìm tất cả templates tương ứng để lấy thông tin vật tư
            templates = ::Models::Farming::PineappleActivityTemplate.where(
              activity_type: act[:activity_type],
              stage: act[:stage]
            )
            
            # Lấy thông tin vật tư từ tất cả templates, tính theo diện tích thực tế
            materials = calculate_materials_by_area(templates, user_id, field_area_ha)
            
            Entities::Farming::FarmActivity.new(
              activity_type: act[:activity_type],
              description: act[:description],
              start_date: act[:start_date],
              end_date: act[:end_date],
              frequency: act[:frequency] || 0,
              status: act[:status] || :pending,
              field_id: act[:field_id] || attributes[:field_id],
              stage: act[:stage],
              materials: materials
            )
          end

          { success: true, activities: activities_entities }
        rescue => e
          { success: false, error: "Lỗi khi tạo kế hoạch: #{e.message}" }
        end
      end

      # Tính toán vật tư theo diện tích thực tế
      def calculate_materials_by_area(templates, user_id, field_area_ha)
        return [] unless user_id && field_area_ha && field_area_ha > 0
        
        calculated_materials = {}
        
        templates.each do |template|
          template.template_activity_materials.includes(:farm_material).each do |tam|
            # Chỉ lấy materials thuộc về user hiện tại
            next unless tam.farm_material.user_id == user_id
            
            material_id = tam.farm_material.id
            base_quantity = tam.quantity # Số lượng cho 1 ha
            
            # Tính số lượng thực tế theo diện tích và làm tròn lên
            actual_quantity = (base_quantity * field_area_ha).ceil
            
            if calculated_materials[material_id]
              # Nếu đã có vật tư này, cộng dồn số lượng
              calculated_materials[material_id][:quantity] += actual_quantity
            else
              calculated_materials[material_id] = {
                id: tam.farm_material.id,
                name: tam.farm_material.name,
                quantity: actual_quantity,
                unit: tam.farm_material.unit,
                template_id: template.id,
                template_name: template.name,
                base_quantity_per_ha: base_quantity,
                field_area_ha: field_area_ha
              }
            end
          end
        end
        
        calculated_materials.values
      end

      def save_activities_plan(id, activities, user_id)
        record = ::Models::Farming::PineappleCrop.find_by(id: id)
        return { success: false, error: "Không tìm thấy vụ trồng dứa" } unless record

        created_activities = []
        template_repo = ::Repositories::Farming::PineappleActivityTemplateRepository.new

        # Lấy diện tích cánh đồng
        field = ::Models::Farming::Field.find_by(id: record.field_id)
        field_area_ha = field&.area ? (field.area.to_f / 10000) : nil

        begin
          ActiveRecord::Base.transaction do
            # Xóa hoạt động cũ đang chờ hoặc đang thực hiện
            record.farm_activities.where(status: [ :pending, :in_progress ]).destroy_all

            # Tạo hoạt động mới từ template
            activities.each do |activity_attrs|
              # Tìm tất cả templates tương ứng (giống logic preview)
              templates = ::Models::Farming::PineappleActivityTemplate.where(
                activity_type: activity_attrs[:activity_type],
                stage: activity_attrs[:stage]
              )

              if templates.any?
                # Tạo activity mới với thông tin từ activity_attrs
                activity = ::Models::Farming::FarmActivity.new(
                  crop_animal_id: record.id,
                  user_id: user_id,
                  activity_type: activity_attrs[:activity_type],
                  description: activity_attrs[:description],
                  start_date: activity_attrs[:start_date],
                  end_date: activity_attrs[:end_date],
                  status: activity_attrs[:status] || "pending",
                  field_id: activity_attrs[:field_id] || record.field_id,
                  frequency: activity_attrs[:frequency] || "once"
                )

                # Bỏ qua kiểm tra trùng lặp khi tạo từ template/confirm_plan
                activity.skip_similar_check = true if activity.respond_to?(:skip_similar_check=)
                # Bỏ qua kiểm tra vật tư cho hoạt động không yêu cầu
                activity.skip_materials_check = true if activity.respond_to?(:skip_materials_check=)
                # Bỏ qua kiểm tra quy trình trồng dứa
                activity.skip_process_validation = true if activity.respond_to?(:skip_process_validation=)

                begin
                  activity.save!
                rescue => e
                  puts "[DEBUG] Activity save failed: #{activity.errors.full_messages.join(", ")}, Exception: #{e.message}"
                  raise e
                end

                # Tính toán vật tư theo diện tích thực tế
                calculated_materials = calculate_materials_by_area(templates, user_id, field_area_ha)

                # Tạo activity_materials cho tất cả vật tư đã tính toán
                calculated_materials.each do |material_data|
                  activity_material = activity.activity_materials.build(
                    farm_material_id: material_data[:id],
                    planned_quantity: material_data[:quantity]
                  )
                  # Bỏ qua reserve khi confirm plan
                  activity_material.skip_reserve = true
                  activity_material.save!
                end

                created_activities << map_activity_to_entity(activity)
              else
                # Nếu không tìm thấy template, tạo hoạt động thủ công
                activity_attrs[:status] = "pending" unless activity_attrs[:status].present?

                activity = ::Models::Farming::FarmActivity.new(
                  crop_animal_id: record.id,
                  user_id: user_id,
                  **activity_attrs
                )

                # Bỏ qua kiểm tra trùng lặp khi tạo từ template/confirm_plan
                activity.skip_similar_check = true if activity.respond_to?(:skip_similar_check=)
                # Bỏ qua kiểm tra vật tư cho hoạt động không yêu cầu
                activity.skip_materials_check = true if activity.respond_to?(:skip_materials_check=)
                # Bỏ qua kiểm tra quy trình trồng dứa
                activity.skip_process_validation = true if activity.respond_to?(:skip_process_validation=)

                begin
                  activity.save!
                rescue => e
                  puts "[DEBUG] Activity save failed: #{activity.errors.full_messages.join(", ")}, Exception: #{e.message}"
                  raise e
                end
                created_activities << map_activity_to_entity(activity)
              end
            end
          end

          {
            success: true,
            activities: created_activities.sort_by(&:start_date),
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
          # Sắp xếp activities theo start_date thay vì theo ID
          activities = record.farm_activities.order(:start_date).map { |activity| map_activity_to_entity(activity) }
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
