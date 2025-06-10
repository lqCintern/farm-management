module Entities
  module Farming
    class FarmActivity
      attr_reader :id, :crop_animal_id, :user_id, :activity_type, :description,
                 :start_date, :end_date, :frequency, :status, :completed_at,
                 :field_id, :created_at, :updated_at

      def initialize(attributes = {})
        @id = attributes[:id]
        @crop_animal_id = attributes[:crop_animal_id]
        @user_id = attributes[:user_id]
        @activity_type = attributes[:activity_type]
        @description = attributes[:description]
        @start_date = attributes[:start_date]
        @end_date = attributes[:end_date]
        @frequency = attributes[:frequency] || 0
        @status = attributes[:status] || :pending
        @completed_at = attributes[:completed_at]
        @field_id = attributes[:field_id]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
      end
    end
  end
end