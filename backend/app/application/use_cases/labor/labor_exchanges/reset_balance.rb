module UseCases::Labor
  module LaborExchanges
    class ResetBalance
      def initialize(exchange_repository, household_repository)
        @exchange_repository = exchange_repository
        @household_repository = household_repository
      end

      def execute(exchange_id, household_id)
        # Verify exchange exists
        result = @exchange_repository.find(exchange_id)
        return result unless result[:success]

        exchange = result[:exchange]

        # Verify household is part of the exchange
        unless [ exchange.household_a_id, exchange.household_b_id ].include?(household_id)
          return { success: false, errors: [ "Bạn không có quyền thực hiện thao tác này" ] }
        end

        # Check if user is household owner (should be done in controller or other layer)

        # Reset the exchange balance
        @exchange_repository.reset_balance(exchange_id)
      end
    end
  end
end
