module Models::Farming
  class FarmActivity < Models::ApplicationRecord
    belongs_to :user
    # Sửa quan hệ để sử dụng foreign key đúng
    belongs_to :pineapple_crop, foreign_key: :crop_animal_id, optional: true, class_name: "Farming::PineappleCrop"
    has_many :activity_materials, class_name: "Farming::ActivityMaterial", dependent: :destroy
    has_many :farm_materials, through: :activity_materials, class_name: "Farming::FarmMaterial"

    # Thêm quan hệ với Field
    belongs_to :field, class_name: "Farming::Field"

    # Lịch trình lặp lại
    belongs_to :parent_activity, class_name: "Farming::FarmActivity", optional: true
    has_many :child_activities, class_name: "Farming::FarmActivity", foreign_key: :parent_activity_id, dependent: :destroy

    # Enum định nghĩa
    enum :status, { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }
    enum :frequency, { once: 0, daily: 1, weekly: 2, monthly: 3 }, prefix: true

    # Định nghĩa các loại hoạt động nông nghiệp
    enum :activity_type, {
      soil_preparation: 0,      # Chuẩn bị đất
      seedling_preparation: 1,  # Chuẩn bị giống & vật tư
      planting: 2,              # Trồng dứa
      leaf_tying: 3,            # Buộc lá
      fertilizing: 4,           # Bón phân
      pesticide: 5,             # Phun thuốc
      sun_protection: 6,        # Che nắng
      fruit_development: 7,     # Thúc quả
      harvesting: 8,            # Thu hoạch
      sprout_collection: 9,     # Tách chồi
      field_cleaning: 10,       # Dọn vườn
      watering: 11,             # Tưới nước
      weeding: 12,              # Làm cỏ
      other: 13                 # Khác
    }, prefix: true

    # Validation
    validates :activity_type, presence: true
    validates :description, length: { maximum: 255 }
    validates :frequency, presence: true
    validates :status, presence: true
    validates :start_date, presence: true
    validates :end_date, presence: true
    validates :field_id, presence: true

    # Validation quy trình trồng dứa - luôn validate vì bây giờ đã chuyển sang model dành riêng cho dứa
    validate :validate_pineapple_process

    # Kiểm tra hoạt động tương tự
    validate :check_similar_activities
    attr_accessor :skip_similar_check, :skip_process_validation

    # Lưu tọa độ cho hoạt động
    # serialize :coordinates, JSON

    # def coordinates_array
    #   coordinates.is_a?(Array) ? coordinates : []
    # end

    # Kiểm tra quy trình trồng dứa
    def validate_pineapple_process
      return if skip_similar_check
      return if parent_activity.present? # Bỏ qua nếu là hoạt động lặp lại
      return unless pineapple_crop.present? # Bỏ qua nếu không có liên kết với pineapple_crop
      return if skip_process_validation # Bỏ qua nếu được yêu cầu
      return if description&.include?("thương lái") # Bỏ qua nếu là marketplace harvest activity

      # Lấy các hoạt động trước đó của cùng cây dứa và cánh đồng
      previous_activities = FarmActivity.where(
        crop_animal_id: crop_animal_id,
        field_id: field_id
      ).where("start_date < ?", start_date).order(start_date: :asc)

      case activity_type
      when "planting"
        # Trước khi trồng phải chuẩn bị đất
        if !previous_activities.activity_type_soil_preparation.exists?
          errors.add(:activity_type, "cần có hoạt động chuẩn bị đất trước khi trồng dứa")
        end
      when "fertilizing", "pesticide", "fruit_development"
        # Trước khi bón phân/phun thuốc/thúc quả phải đã trồng
        if !previous_activities.activity_type_planting.exists?
          errors.add(:activity_type, "cần có hoạt động trồng dứa trước khi #{I18n.t("activity_types.#{activity_type}")}")
        end
      when "harvesting"
        # Trước khi thu hoạch phải đã trồng và phải có ít nhất 1 lần bón phân
        if !previous_activities.activity_type_planting.exists?
          errors.add(:activity_type, "cần có hoạt động trồng dứa trước khi thu hoạch")
        elsif !previous_activities.activity_type_fertilizing.exists?
          errors.add(:activity_type, "cần có hoạt động bón phân trước khi thu hoạch")
        end

        # Kiểm tra thời gian trồng đến thu hoạch (ví dụ: trồng dứa ít nhất 12 tháng)
        planting = previous_activities.activity_type_planting.first
        if planting && (start_date - planting.start_date).to_i < 365 # 12 tháng
          errors.add(:start_date, "thời gian thu hoạch quá sớm, cần ít nhất 12 tháng sau khi trồng")
        end
      end
    end

    # Kiểm tra hoạt động tương tự
    def check_similar_activities
      return if parent_activity.present? || skip_similar_check == true
      return if description&.include?("thương lái") # Bỏ qua nếu là marketplace harvest activity

      # Tìm hoạt động tương tự (cùng loại, cùng cánh đồng, trong khoảng thời gian gần nhau)
      similar_activities = FarmActivity.where(
        activity_type: activity_type,
        field_id: field_id,
        crop_animal_id: crop_animal_id
      ).where("start_date BETWEEN ? AND ?", start_date - 7.days, start_date + 7.days)
      .where.not(id: id) # Loại trừ chính nó

      if similar_activities.exists?
        errors.add(:base, "Đã tồn tại hoạt động tương tự trên cùng cánh đồng trong khoảng thời gian này")
      end
    end

    # Thêm helper method để dễ truy cập pineapple_crop_id (giúp code dễ đọc hơn)
    def pineapple_crop_id
      crop_animal_id
    end

    def pineapple_crop_id=(value)
      self.crop_animal_id = value
    end

    # Các hoạt động bắt buộc phải có vật tư
    MATERIAL_REQUIRED_ACTIVITIES = %w[fertilizing pesticide fruit_development].freeze

    # Validation cho material
    validate :validate_materials_requirement

    # Thêm thuộc tính skip_materials_check
    attr_accessor :skip_materials_check

    # Callback để xử lý activity_materials khi status thay đổi
    after_update :update_activity_materials_on_status_change, if: :saved_change_to_status?

    # Sửa phương thức validate_materials_requirement
    def validate_materials_requirement
      # Bỏ qua kiểm tra nếu được yêu cầu
      return if skip_materials_check

      # Kiểm tra nếu hoạt động yêu cầu vật tư nhưng không có
      if MATERIAL_REQUIRED_ACTIVITIES.include?(activity_type) && activity_materials.empty?
        errors.add(:base, "Hoạt động #{I18n.t("activity_types.#{activity_type}")} cần có ít nhất một vật tư")
      end
    end

    # Helper method để check xem hoạt động có cần vật tư không
    def requires_materials?
      MATERIAL_REQUIRED_ACTIVITIES.include?(activity_type)
    end

    # Kiểm tra vật tư trước khi bắt đầu hoạt động
    def check_materials_before_start(actual_materials = {})
      return true unless requires_materials?
      
      insufficient_materials = []
      
      activity_materials.each do |material|
        # Nếu có actual_materials cho material này, kiểm tra theo actual_quantity
        if actual_materials[material.farm_material_id.to_s].present?
          actual_qty = actual_materials[material.farm_material_id.to_s].to_f
          
          # Nếu actual <= planned, có thể dùng được (vì đã reserve planned)
          if actual_qty <= material.planned_quantity
            # Không cần kiểm tra thêm vì đã reserve đủ
          else
            # Nếu actual > planned, cần kiểm tra tổng số lượng có đủ không
            if material.farm_material.quantity < actual_qty
              insufficient_materials << "#{material.farm_material.name} (cần: #{actual_qty}, có: #{material.farm_material.quantity})"
            end
          end
        else
          # Nếu không có actual_materials, kiểm tra theo planned_quantity
          unless material.can_commit?
            insufficient_materials << material.farm_material.name
          end
        end
      end
      
      if insufficient_materials.any?
        errors.add(:base, "Không đủ vật tư: #{insufficient_materials.join(', ')}")
        return false
      end
      
      true
    end

    # Kiểm tra có thể hoàn thành không
    def can_complete?
      status == "pending"
    end

    # Kiểm tra có thể hủy không
    def can_cancel?
      status == "pending"
    end

    # Cập nhật actual quantity cho vật tư
    def update_material_actual_quantities(material_quantities)
      # material_quantities format: { material_id => actual_quantity }
      
      material_quantities.each do |material_id, actual_qty|
        activity_material = activity_materials.find_by(farm_material_id: material_id)
        next unless activity_material
        
        unless activity_material.update_actual_quantity(actual_qty)
          errors.add(:base, "Không thể cập nhật vật tư #{activity_material.farm_material.name}")
          return false
        end
      end
      
      true
    end

    # Callback để xử lý activity_materials khi status thay đổi
    def update_activity_materials_on_status_change
      # Trigger callback trên activity_materials để cập nhật reserved_quantity
      activity_materials.each(&:handle_activity_status_change)
    end

    # Hoàn thành hoạt động (tự động xử lý material khi complete)
    def complete_activity(actual_materials = {})
      return false unless status == "pending"
      
      # Kiểm tra vật tư trước khi hoàn thành
      unless check_materials_before_start(actual_materials)
        return false
      end
      
      # Cập nhật actual_materials trước
      if actual_materials.present?
        actual_materials.each do |material_id, quantity|
          quantity = quantity.to_f
          next if quantity <= 0

          material_id = material_id.to_i if material_id.is_a?(String)
          activity_material = activity_materials.find_by(farm_material_id: material_id)
          
          if activity_material
            # Cập nhật actual_quantity
            activity_material.actual_quantity = quantity
            activity_material.save!
          end
        end
      end
      
      # Commit vật tư theo actual_quantity hoặc planned_quantity
      activity_materials.each do |material|
        # Xác định số lượng cần commit
        commit_quantity = if material.actual_quantity.present?
          material.actual_quantity
        else
          material.planned_quantity
        end
        
        # Commit theo số lượng thực tế sử dụng
        unless material.farm_material.commit_quantity(commit_quantity)
          errors.add(:base, "Không thể sử dụng vật tư #{material.farm_material.name}")
          return false
        end
        
        # Nếu actual < planned, trả lại phần dư vào quantity
        if material.actual_quantity.present? && material.actual_quantity < material.planned_quantity
          difference = material.planned_quantity - material.actual_quantity
          material.farm_material.return_quantity(difference)
        end
      end
      
      update(status: "completed")
    end

    # Hủy hoạt động
    def cancel_activity
      return false unless status == "pending"
      update(status: "cancelled")
    end
  end
end
