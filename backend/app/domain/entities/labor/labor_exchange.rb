module Entities
  module Labor
    class LaborExchange
      attr_accessor :id, :household_a_id, :household_b_id, :hours_balance,
                    :last_transaction_date, :created_at, :updated_at,
                    :household_a_name, :household_b_name

      def initialize(attributes = {})
        @id = attributes[:id]
        @household_a_id = attributes[:household_a_id]
        @household_b_id = attributes[:household_b_id]
        @hours_balance = attributes[:hours_balance] || 0.0
        @last_transaction_date = attributes[:last_transaction_date]
        @created_at = attributes[:created_at]
        @updated_at = attributes[:updated_at]
        @household_a_name = attributes[:household_a_name]
        @household_b_name = attributes[:household_b_name]
      end

      def validate
        errors = []
        errors << "Household A ID is required" if household_a_id.nil?
        errors << "Household B ID is required" if household_b_id.nil?
        errors << "Households must be different" if household_a_id == household_b_id
        errors
      end

      # Get balance from perspective of specified household
      def balance_for(household_id)
        if household_id == household_a_id
          -hours_balance
        elsif household_id == household_b_id
          hours_balance
        else
          raise ArgumentError, "Household ID \\#{household_id} is not part of this exchange"
        end
      end

      # Get partner household ID
      def partner_household_id(household_id)
        # Ensure household_id is integer
        household_id = household_id.to_i if household_id.is_a?(Symbol) || household_id.is_a?(String)
        
        if household_id == household_a_id
          household_b_id
        elsif household_id == household_b_id
          household_a_id
        else
          raise ArgumentError, "Household ID #{household_id} is not part of this exchange"
        end
      end

      # Get partner household name
      def partner_household_name(household_id)
        # Ensure household_id is integer
        household_id = household_id.to_i if household_id.is_a?(Symbol) || household_id.is_a?(String)
        
        if household_id == household_a_id
          household_b_name
        elsif household_id == household_b_id
          household_a_name
        else
          raise ArgumentError, "Household ID #{household_id} is not part of this exchange"
        end
      end
    end
  end
end
