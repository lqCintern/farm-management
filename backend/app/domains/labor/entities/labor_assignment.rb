module Labor
  module Entities
    class LaborAssignment
      attr_accessor :id, :labor_request_id, :worker_id, :home_household_id,
                    :work_date, :start_time, :end_time, :status, :notes,
                    :hours_worked, :work_units, :worker_rating, :farmer_rating,
                    :exchange_processed, :created_at, :updated_at
      
      def initialize(attrs = {})
        @id = attrs[:id]
        @labor_request_id = attrs[:labor_request_id]
        @worker_id = attrs[:worker_id]
        @home_household_id = attrs[:home_household_id]
        @work_date = attrs[:work_date]
        @start_time = attrs[:start_time]
        @end_time = attrs[:end_time]
        @status = attrs[:status]
        @notes = attrs[:notes]
        @hours_worked = attrs[:hours_worked]
        @work_units = attrs[:work_units]
        @worker_rating = attrs[:worker_rating]
        @farmer_rating = attrs[:farmer_rating]
        @exchange_processed = attrs[:exchange_processed] || false
        @created_at = attrs[:created_at]
        @updated_at = attrs[:updated_at]
      end
      
      # Convenience methods
      def assigned?
        @status == 'assigned'
      end
      
      def worker_reported?
        @status == 'worker_reported'
      end
      
      def completed?
        @status == 'completed'
      end
      
      def missed?
        @status == 'missed'
      end
      
      def rejected?
        @status == 'rejected'
      end
    end
    end
end