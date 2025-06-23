module Entities
  module Labor
    class FarmHousehold
      attr_accessor :id, :name, :description, :province, :district, :ward, :address, :owner_id

      def initialize(attrs = {})
        @id = attrs[:id]
        @name = attrs[:name]
        @description = attrs[:description]
        @province = attrs[:province]
        @district = attrs[:district]
        @ward = attrs[:ward]
        @address = attrs[:address]
        @owner_id = attrs[:owner_id]
      end
    end

    class HouseholdSummary
      attr_accessor :household, :active_workers_count, :total_exchanges, :pending_requests, :upcoming_assignments

      def initialize(attrs = {})
        @household = attrs[:household]
        @active_workers_count = attrs[:active_workers_count] || 0
        @total_exchanges = attrs[:total_exchanges] || 0
        @pending_requests = attrs[:pending_requests] || 0
        @upcoming_assignments = attrs[:upcoming_assignments] || 0
      end
    end
  end
end
