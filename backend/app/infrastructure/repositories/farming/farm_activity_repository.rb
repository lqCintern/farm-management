module Repositories
  module Farming
    class FarmActivityRepository
      def find_by_id(id, user_id = nil)
        query = ::Models::Farming::FarmActivity
        query = query.where(user_id: user_id) if user_id
        record = query.find_by(id: id)

        return nil unless record
        map_to_entity(record)
      end

      def find_all(user_id, filters = {})
        query = ::Models::Farming::FarmActivity.where(user_id: user_id)

        # Áp dụng filters
        query = apply_filters(query, filters)

        # Sắp xếp mặc định
        query = query.order(start_date: :desc)

        {
          records: query,
          entities: query.map { |record| map_to_entity(record) }
        }
      end

      def create(attributes, user_id)
        # Tách materials khỏi params để xử lý riêng
        materials = attributes.delete(:materials)

        # Tạo record FarmActivity
        record = ::Models::Farming::FarmActivity.new(attributes)
        record.user_id = user_id
        record.skip_materials_check = true if record.respond_to?(:skip_materials_check=)

        # Thử tạo record trong transaction
        begin
          ActiveRecord::Base.transaction do
            if record.save
              # Xử lý materials nếu có
              process_materials(record, materials, user_id) if materials.present?

              # Xử lý lịch trình lặp lại
              process_recurring_schedule(record, attributes) if record.frequency != "once" && record.frequency != :once
            else
              raise ActiveRecord::Rollback
            end
          end

          # Nếu đến đây nghĩa là transaction đã thành công
          map_to_entity(record)
        rescue => e
          { success: false, errors: [ e.message ] }
        end
      end

      def update(id, attributes, user_id)
        record = ::Models::Farming::FarmActivity.where(user_id: user_id).find_by(id: id)
        return { success: false, errors: ["Không tìm thấy hoạt động"] } unless record

        # Tách materials khỏi params để xử lý riêng
        materials = attributes.delete(:materials)

        # Kiểm tra xem hoạt động đã hoàn thành chưa
        if record.completed?
          return { success: false, errors: ["Không thể chỉnh sửa hoạt động đã hoàn thành"] }
        end

        begin
          ActiveRecord::Base.transaction do
            # Cập nhật record
            if record.update(attributes)
              # Xử lý materials nếu có
              process_materials(record, materials, user_id) if materials.present?

              # Xử lý lịch trình lặp lại nếu cần
              process_recurring_schedule(record, attributes) if record.frequency != "once" && record.frequency != :once
            else
              raise ActiveRecord::Rollback
            end
          end

          map_to_entity(record)
        rescue => e
          { success: false, errors: [e.message] }
        end
      end

      def delete(id, user_id)
        record = ::Models::Farming::FarmActivity.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy hoạt động" } unless record

        # Lấy materials hiện tại để trả về kho
        old_materials = get_current_materials(record)

        begin
          ActiveRecord::Base.transaction do
            # Trả materials về kho
            return_materials_to_inventory(old_materials, user_id)

            # Cập nhật trạng thái thành cancelled thay vì xóa
            record.update!(status: :cancelled)
          end

          { success: true }
        rescue => e
          { success: false, error: e.message }
        end
      end

      def complete(id, completion_params, user_id)
        record = ::Models::Farming::FarmActivity.where(user_id: user_id).find_by(id: id)
        return { success: false, error: "Không tìm thấy hoạt động" } unless record

        # Kiểm tra trạng thái
        unless record.status == "pending"
          return { success: false, error: "Chỉ có thể hoàn thành hoạt động ở trạng thái pending" }
        end

        # Cập nhật thông tin hoàn thành
        record.actual_completion_date = Date.today
        record.actual_notes = completion_params[:actual_notes] if completion_params[:actual_notes].present?

        # Hoàn thành hoạt động (sẽ tự động commit material và cập nhật actual_materials)
        actual_materials = completion_params[:actual_materials] || {}
        if record.complete_activity(actual_materials)
          # Cập nhật pineapple_crop sau khi hoàn thành hoạt động
          stage_advance_message = update_pineapple_crop_after_completion(record)

          # Kiểm tra chuyển giai đoạn (cho suggestion)
          suggestion = check_stage_completion(record)

          { 
            success: true, 
            farm_activity: map_to_entity(record),
            suggestion: suggestion,
            stage_advance_message: stage_advance_message
          }
        else
          { success: false, error: record.errors.full_messages.join(", ") }
        end
      end

      def find_by_field(crop_animal_id, user_id, page = 1, items_per_page = 10)
        query = ::Models::Farming::FarmActivity
                .where(crop_animal_id: crop_animal_id, user_id: user_id)
                .order(start_date: :desc)

        query
      end

      def find_by_stage(crop_id, user_id, current_stage_only = false)
        crop = ::Models::Farming::PineappleCrop.find_by(id: crop_id)
        return [] unless crop

        query = ::Models::Farming::FarmActivity.where(crop_animal_id: crop_id, user_id: user_id)

        if current_stage_only.to_s == "true" && crop.current_stage.present?
          stage_templates = ::Models::Farming::PineappleActivityTemplate.where(stage: crop.current_stage)
          stage_activity_types = stage_templates.pluck(:activity_type).uniq
          query = query.where(activity_type: stage_activity_types)
        end

        query.order(start_date: :asc)
      end

      def find_upcoming_activities
        # Kiểm tra các hoạt động diễn ra trong vòng 1 ngày tới
        tomorrow = Date.tomorrow.beginning_of_day
        tomorrow_end = Date.tomorrow.end_of_day

        activities = ::Models::Farming::FarmActivity.includes(:user, :field)
                     .where("start_date BETWEEN ? AND ?", tomorrow, tomorrow_end)
                     .where(status: [ :pending, :in_progress ])

        activities.map { |record| map_to_entity(record) }
      end

      def find_overdue_activities
        # Kiểm tra các hoạt động quá hạn
        yesterday = Date.yesterday.end_of_day

        activities = ::Models::Farming::FarmActivity.includes(:user, :field)
                     .where("end_date < ?", yesterday)
                     .where.not(status: :completed)

        activities.map { |record| map_to_entity(record) }
      end

      def find_by_crop_animal_id(crop_animal_id, user_id)
        records = ::Models::Farming::FarmActivity
                 .where(user_id: user_id)
                 .where(crop_animal_id: crop_animal_id)
                 .order(start_date: :desc)

        {
          records: records,
          entities: records.map { |record| map_to_entity(record) }
        }
      end

      def find_by_activity_types(activity_types, crop_animal_id, user_id)
        records = ::Models::Farming::FarmActivity
                 .where(user_id: user_id)
                 .where(crop_animal_id: crop_animal_id)
                 .where(activity_type: activity_types)
                 .order(start_date: :asc)

        {
          records: records,
          entities: records.map { |record| map_to_entity(record) }
        }
      end

      private

      def apply_filters(query, filters)
        # Lọc theo ngày
        if filters[:start_date].present? && filters[:end_date].present?
          begin
            start_date = Date.parse(filters[:start_date])
            end_date = Date.parse(filters[:end_date])
            query = query.where("start_date >= ? AND end_date <= ?", start_date, end_date)
          rescue Date::Error
            # Bỏ qua nếu định dạng ngày không hợp lệ
          end
        end

        # Lọc theo loại hoạt động
        query = query.where(activity_type: filters[:activity_type]) if filters[:activity_type].present?

        # Lọc theo crop_animal_id
        query = query.where(crop_animal_id: filters[:crop_animal_id]) if filters[:crop_animal_id].present?

        # Lọc theo trạng thái
        query = query.where(status: filters[:status]) if filters[:status].present?

        # Trả về query đã được lọc
        query
      end

      def process_materials(record, materials, user_id)
        return unless materials.present?

        # Xóa các liên kết cũ nếu là update
        record.activity_materials.destroy_all if record.activity_materials.exists?

        # Tạo mới các liên kết
        materials.each do |material_id, quantity|
          material_id = material_id.to_i if material_id.is_a?(String)
          quantity = quantity.to_f

          next if quantity <= 0

          material = ::Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: material_id)

          if material.nil?
            raise "Không tìm thấy vật tư với ID #{material_id}"
          end

          # Kiểm tra available_quantity thay vì quantity
          if material.available_quantity < quantity
            raise "Không đủ vật tư #{material.name} trong kho (cần: #{quantity}, có thể sử dụng: #{material.available_quantity})"
          end

          # Tạo liên kết (sẽ tự động reserve thông qua callback)
          record.activity_materials.create!(
            farm_material_id: material_id,
            planned_quantity: quantity
          )
        end

        # Validate yêu cầu vật tư
        validate_materials_requirement(record)
      end

      def validate_materials_requirement(record)
        required_activities = ::Models::Farming::FarmActivity::MATERIAL_REQUIRED_ACTIVITIES

        if required_activities.include?(record.activity_type.to_s) && record.activity_materials.reload.empty?
          raise "Hoạt động này cần có ít nhất một vật tư"
        end
      end

      def get_current_materials(record)
        record.activity_materials.map do |am|
          material_id = am.respond_to?(:farm_material_id) ? am.farm_material_id : am.material_id
          [ material_id, am.planned_quantity || 0 ]
        end.to_h
      end

      def return_materials_to_inventory(materials_hash, user_id)
        materials_hash.each do |material_id, quantity|
          material = ::Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: material_id)
          if material
            # Release reserved quantity thay vì cộng vào quantity
            material.release_reserved_quantity(quantity)
          end
        end
      end

      def update_actual_materials(record, actual_materials, user_id)
        actual_materials.each do |material_id, quantity|
          quantity = quantity.to_f
          next if quantity <= 0

          material_id = material_id.to_i if material_id.is_a?(String)

          # Tìm liên kết activity_material
          activity_material = record.activity_materials.find_by(farm_material_id: material_id)
          material = ::Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: material_id)

          unless material
            raise "Không tìm thấy vật tư với ID #{material_id}"
          end

          # Nếu không tìm thấy liên kết, tạo mới
          unless activity_material
            activity_material = record.activity_materials.create!(
              farm_material_id: material_id,
              planned_quantity: quantity,
              actual_quantity: quantity
            )
          else
            # Gọi update_actual_quantity để trigger đúng callback và logic
            unless activity_material.update_actual_quantity(quantity)
              raise "Không thể cập nhật vật tư #{material.name}"
            end
          end
        end
      end

      def process_recurring_schedule(record, params)
        return unless record.respond_to?(:frequency) && record.frequency.present?

        interval_days = case record.frequency.to_s
        when "daily" then 1
        when "weekly" then 7
        when "monthly" then 30
        else return # once hoặc giá trị không hợp lệ
        end

        # Tạo lịch lặp lại cho 3 lần tiếp theo
        3.times do |i|
          next_start_date = record.start_date + interval_days * (i + 1)
          next_end_date = record.end_date + interval_days * (i + 1) if record.end_date

          # Tạo bản ghi con liên quan
          child = ::Models::Farming::FarmActivity.create!(
            user_id: record.user_id,
            crop_animal_id: record.crop_animal_id,
            activity_type: record.activity_type,
            description: record.description,
            status: :pending,
            start_date: next_start_date,
            end_date: next_end_date,
            frequency: "once", # Các bản ghi con không tự tạo thêm
            parent_activity_id: record.id,
            field_id: record.field_id
          )
        end
      end

      def update_pineapple_crop_after_completion(record)
        return unless record.crop_animal_id.present?

        pineapple_crop = ::Models::Farming::PineappleCrop.find_by(id: record.crop_animal_id)
        return unless pineapple_crop

        # Cập nhật các mốc quan trọng dựa trên loại hoạt động
        case record.activity_type.to_s
        when "flower_treatment"
          pineapple_crop.update(actual_flower_date: record.actual_completion_date)
        when "harvesting"
          # Xử lý hoạt động thu hoạch nếu cần
        end

        # Kiểm tra và tự động chuyển giai đoạn nếu tất cả hoạt động của giai đoạn hiện tại đã hoàn thành
        check_and_advance_stage(pineapple_crop, record.user_id)
      end

      def check_and_advance_stage(pineapple_crop, user_id)
        # Mapping giữa stage và activity types theo quy trình thực tế trồng dứa
        stage_activity_mapping = {
          "preparation" => ["soil_preparation"],
          "seedling_preparation" => ["seedling_preparation"],
          "planting" => ["planting"],
          "leaf_tying" => ["leaf_tying"],
          "first_fertilizing" => ["fertilizing"],
          "second_fertilizing" => ["fertilizing"],
          "flower_treatment" => ["pesticide"],
          "sun_protection" => ["sun_protection"],
          "fruit_development" => ["fruit_development"],
          "harvesting" => ["harvesting"],
          "sprout_collection" => ["sprout_collection"],
          "field_cleaning" => ["field_cleaning"]
        }

        current_stage = pineapple_crop.current_stage
        stage_activity_types = stage_activity_mapping[current_stage] || []
        
        # Lấy tất cả hoạt động của giai đoạn hiện tại
        stage_activities = ::Models::Farming::FarmActivity
                           .where(crop_animal_id: pineapple_crop.id, user_id: user_id)
                           .where(activity_type: stage_activity_types)

        # Nếu tất cả hoạt động của giai đoạn hiện tại đã hoàn thành
        if stage_activities.where.not(status: :completed).empty? && stage_activities.exists?
          # Tự động chuyển sang giai đoạn tiếp theo
          if pineapple_crop.advance_to_next_stage
            next_stage = pineapple_crop.current_stage
            next_stage_name = ::Models::Farming::PineappleCrop.current_stages.key(next_stage)
            
            return {
              stage_advanced: true,
              message: "Đã tự động chuyển sang giai đoạn: #{I18n.t("pineapple_stages.#{next_stage_name}")}",
              next_stage: next_stage_name
            }
          end
        end

        nil
      end

      def check_stage_completion(record)
        return nil unless record.crop_animal_id.present?

        crop = ::Models::Farming::PineappleCrop.find_by(id: record.crop_animal_id)
        return nil unless crop

        # Kiểm tra nếu tất cả hoạt động của giai đoạn hiện tại đã hoàn thành
        stage_templates = ::Models::Farming::PineappleActivityTemplate.where(stage: crop.current_stage)
        stage_activities = ::Models::Farming::FarmActivity
                           .where(crop_animal_id: crop.id, user_id: record.user_id)
                           .where(activity_type: stage_templates.pluck(:activity_type))

        if stage_activities.where.not(status: :completed).empty?
          return "Tất cả hoạt động của giai đoạn hiện tại đã hoàn thành. Bạn có thể chuyển sang giai đoạn tiếp theo."
        end

        nil
      end

      def map_to_entity(record)
        Entities::Farming::FarmActivity.new(
          id: record.id,
          crop_animal_id: record.crop_animal_id,
          activity_type: record.activity_type,
          description: record.description,
          frequency: record.frequency,
          status: record.status,
          start_date: record.start_date,
          end_date: record.end_date,
          created_at: record.created_at,
          updated_at: record.updated_at,
          user_id: record.user_id,
          actual_completion_date: record.actual_completion_date,
          actual_notes: record.actual_notes,
          parent_activity_id: record.parent_activity_id,
          field_id: record.field_id,
          coordinates: record.try(:coordinates),
          status_details: calculate_status_details(record),
          requires_materials: record.try(:requires_materials?) || false,
          materials: map_materials(record),
          actual_materials: map_actual_materials(record)
        )
      end

      def map_materials(record)
        return [] unless record.respond_to?(:activity_materials)

        record.activity_materials.map do |am|
          material = am.farm_material
          {
            id: material.id,
            name: material.name,
            quantity: am.planned_quantity,
            unit: material.unit
          }
        end
      end

      def map_actual_materials(record)
        return [] unless record.respond_to?(:activity_materials)

        actual_materials = []
        record.activity_materials.each do |am|
          next unless am.actual_quantity.present?

          material = am.farm_material
          actual_materials << {
            id: material.id,
            name: material.name,
            quantity: am.actual_quantity,
            unit: material.unit
          }
        end

        actual_materials
      end

      def calculate_status_details(record)
        today = Date.today

        starting_soon = record.start_date && record.start_date.between?(today, today + 7.days)
        ending_soon = record.end_date && record.end_date.between?(today, today + 3.days)
        overdue = record.end_date && record.end_date < today && record.status != "completed" && record.status != :completed
        overdue_days = overdue ? (today - record.end_date).to_i : 0

        {
          starting_soon: starting_soon,
          ending_soon: ending_soon,
          overdue: overdue,
          overdue_days: overdue_days
        }
      end
    end
  end
end
