module Labor
  module LaborExchanges
    class RecalculateBalance
      def initialize(exchange_repository)
        @exchange_repository = exchange_repository
      end
      
      def execute(household_a_id, household_b_id)
        @exchange_repository.recalculate_balance(household_a_id, household_b_id)
      end
    end
  end
end
