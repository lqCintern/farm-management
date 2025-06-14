module Labor
  module Entities
    class HouseholdWorker
      attr_accessor :id, :household_id, :worker_id, :relationship, 
                    :is_active, :joined_date, :notes
      
      def initialize(attrs = {})
        @id = attrs[:id]
        @household_id = attrs[:household_id]
        @worker_id = attrs[:worker_id]
        @relationship = attrs[:relationship]
        @is_active = attrs[:is_active] || true
        @joined_date = attrs[:joined_date]
        @notes = attrs[:notes]
      end
    end
    end
end