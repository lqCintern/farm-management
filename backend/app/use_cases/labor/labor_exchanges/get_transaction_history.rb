module Labor
  module LaborExchanges
    class GetTransactionHistory
      def initialize(exchange_repository)
        @exchange_repository = exchange_repository
      end
      
      def execute(household_a_id, household_b_id, options = {})
        # Find exchange between these households
        result = @exchange_repository.find_by_households(household_a_id, household_b_id)
        return result unless result[:success]
        
        exchange = result[:exchange]
        
        # Get transactions with pagination
        @exchange_repository.get_transactions(exchange.id, options)
      end
    end
  end
end
