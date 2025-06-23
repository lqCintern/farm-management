module Entities
  module Labor
    class LaborRequest
      attr_accessor :id, :title, :description, :request_type, :status,
                    :requesting_household_id, :providing_household_id,
                    :requesting_household_name, :providing_household_name, # Thêm thuộc tính mới
                    :start_date, :end_date, :start_time, :end_time,
                    :workers_needed, :is_public,
                    :parent_request_id, :request_group_id, :max_acceptors,
                    :farm_activity_id, :rate, :created_at, :updated_at

      def initialize(attributes = {})
        @id = attributes[:id]
        @title = attributes[:title]
        @description = attributes[:description]
        @request_type = attributes[:request_type] || "exchange"
        @status = attributes[:status] || "pending"
        @requesting_household_id = attributes[:requesting_household_id]
        @providing_household_id = attributes[:providing_household_id]
        @requesting_household_name = attributes[:requesting_household_name]
        @providing_household_name = attributes[:providing_household_name]
        @start_date = attributes[:start_date]
        @end_date = attributes[:end_date]
        @start_time = attributes[:start_time]
        @end_time = attributes[:end_time]
        @workers_needed = attributes[:workers_needed]
        @is_public = attributes[:is_public] || false
        @parent_request_id = attributes[:parent_request_id]
        @request_group_id = attributes[:request_group_id]
        @max_acceptors = attributes[:max_acceptors]
        @farm_activity_id = attributes[:farm_activity_id]
        @rate = attributes[:rate]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
      end

      # Business Rules
      def original_request?
        parent_request_id.nil? && !request_group_id.nil?
      end

      def pending?
        status == "pending"
      end

      def accepted?
        status == "accepted"
      end

      def declined?
        status == "declined"
      end

      def completed?
        status == "completed"
      end

      def cancelled?
        status == "cancelled"
      end

      def days_range
        (start_date..end_date).to_a
      end

      def validate
        errors = []
        errors << "Tiêu đề không được để trống" if title.nil? || title.empty?
        errors << "Hộ yêu cầu không được để trống" if requesting_household_id.nil?
        errors << "Ngày bắt đầu không được để trống" if start_date.nil?
        errors << "Ngày kết thúc không được để trống" if end_date.nil?

        if start_date && end_date && end_date < start_date
          errors << "Ngày kết thúc phải sau ngày bắt đầu"
        end

        if providing_household_id && providing_household_id == requesting_household_id
          errors << "Hộ cung cấp không thể giống với hộ yêu cầu"
        end

        errors
      end
    end
  end
end
