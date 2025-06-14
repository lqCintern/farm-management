module Farming
  module Models
    class Harvest < ApplicationRecord
      # Quan hệ
      belongs_to :user
      belongs_to :pineapple_crop, class_name: "Farming::PineappleCrop", foreign_key: :crop_id, optional: true
      belongs_to :field, class_name: "Farming::Field"
      belongs_to :farm_activity, class_name: "Farming::FarmActivity", optional: true

      # Validation
      validates :quantity, presence: true, numericality: { greater_than: 0 }
      validates :harvest_date, presence: true
      validates :coordinates, presence: true, allow_nil: true

      # Callback
      before_validation :set_field_from_pineapple_crop
      after_create :create_harvest_activity, unless: :farm_activity_id?

      # Custom method để tính diện tích từ tọa độ
      def calculate_area
        return 0 unless coordinates.present?

        begin
          points = coordinates.map { |coord| Geokit::LatLng.new(coord["lat"].to_f, coord["lng"].to_f) }
          Geokit::Polygon.new(points).area * 10_000 # Chuyển từ km2 sang m2
        rescue => e
          Rails.logger.error "Error calculating area: #{e.message}"
          0
        end
      end

      private

      # Lấy field từ pineapple_crop nếu không có
      def set_field_from_pineapple_crop
        return if field_id.present? || pineapple_crop&.field_id.blank?

        self.field_id = pineapple_crop.field_id
      end

      # Tạo hoạt động thu hoạch tương ứng
      def create_harvest_activity
        activity = Farming::FarmActivity.new(
          user_id: user_id,
          crop_id: crop_id,
          field_id: field_id,
          activity_type: "harvesting",
          description: "Thu hoạch #{quantity} kg",
          frequency: "once",
          status: "completed",
          start_date: harvest_date,
          end_date: harvest_date,
          coordinates: coordinates,
          actual_completion_date: harvest_date
        )

        # Bỏ qua validation quy trình và kiểm tra trùng lặp
        activity.skip_process_validation = true if activity.respond_to?(:skip_process_validation=)
        activity.skip_similar_check = true if activity.respond_to?(:skip_similar_check=)

        if activity.save
          # Cập nhật liên kết
          update_column(:farm_activity_id, activity.id)
        else
          Rails.logger.error "Failed to create harvest activity: #{activity.errors.full_messages.join(', ')}"
        end
      end
    end
  end
end
