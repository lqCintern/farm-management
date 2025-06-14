module Farming
  module Models
    class FarmActivity < ApplicationRecord
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
      enum :status, { pending: 0, completed: 1, cancelled: 2 }
      enum :frequency, { once: 0, daily: 1, weekly: 2, monthly: 3 }, prefix: true

      # Định nghĩa các loại hoạt động nông nghiệp
      enum :activity_type, {
        soil_preparation: 0,
        planting: 1,
        fertilizing: 2,
        watering: 3,
        pesticide: 4,
        pruning: 5,
        weeding: 6,
        harvesting: 7,
        other: 8
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
      attr_accessor :skip_similar_check

      # Lưu tọa độ cho hoạt động
      # serialize :coordinates, JSON

      # def coordinates_array
      #   coordinates.is_a?(Array) ? coordinates : []
      # end

      # Kiểm tra quy trình trồng dứa
      def validate_pineapple_process
        return if parent_activity.present? # Bỏ qua nếu là hoạt động lặp lại
        return unless pineapple_crop.present? # Bỏ qua nếu không có liên kết với pineapple_crop

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
        when "fertilizing"
          # Trước khi bón phân phải đã trồng
          if !previous_activities.activity_type_planting.exists?
            errors.add(:activity_type, "cần có hoạt động trồng dứa trước khi bón phân")
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
      MATERIAL_REQUIRED_ACTIVITIES = %w[fertilizing pesticide].freeze

      # Validation cho material
      validate :validate_materials_requirement

      # Thêm thuộc tính skip_materials_check
      attr_accessor :skip_materials_check

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
    end
  end
end