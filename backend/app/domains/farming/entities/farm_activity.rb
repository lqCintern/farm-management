
  module Farming
    module Entities
    class FarmActivity
      attr_accessor :id, :crop_animal_id, :activity_type, :description, :frequency,
                    :status, :start_date, :end_date, :created_at, :updated_at,
                    :user_id, :actual_completion_date, :actual_notes, :parent_activity_id,
                    :field_id, :coordinates, :status_details, :requires_materials,
                    :materials, :actual_materials, :child_activities

      def initialize(attributes = {})
        attributes.each do |key, value|
          send("#{key}=", value) if respond_to?("#{key}=")
        end
      end

      def pending?
        status == "pending" || status == :pending
      end

      def completed?
        status == "completed" || status == :completed
      end

      def cancelled?
        status == "cancelled" || status == :cancelled
      end
    end
  end
end
