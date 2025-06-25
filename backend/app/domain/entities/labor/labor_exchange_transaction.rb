module Entities
  module Labor
    class LaborExchangeTransaction
      attr_accessor :id, :labor_exchange_id, :labor_assignment_id, :hours,
                    :description, :created_at, :updated_at,
                    :worker_name, :work_date, :assignment_details

      def initialize(attributes = {})
        @id = attributes[:id]
        @labor_exchange_id = attributes[:labor_exchange_id]
        @labor_assignment_id = attributes[:labor_assignment_id]
        @hours = attributes[:hours]
        @description = attributes[:description]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @worker_name = attributes[:worker_name]
        @work_date = attributes[:work_date]
        @assignment_details = attributes[:assignment_details] || {}
      end

      def validate
        errors = []
        errors << "Labor exchange ID is required" if labor_exchange_id.nil?
        errors << "Hours is required" if hours.nil?
        errors << "Description is required" if description.nil? || description.empty?
        errors
      end

      def as_json(*_args)
        {
          id: id,
          labor_exchange_id: labor_exchange_id,
          labor_assignment_id: labor_assignment_id,
          hours: hours,
          description: description,
          created_at: created_at,
          updated_at: updated_at,
          worker_name: worker_name,
          work_date: work_date,
          assignment_details: assignment_details,
          direction_info: defined?(@direction_info) ? @direction_info : nil
        }
      end
    end
  end
end
