module UseCases::Labor
  module LaborExchanges
    class ListHouseholdExchanges
      def initialize(exchange_repository)
        @exchange_repository = exchange_repository
      end

      def execute(household_id)
        exchanges = @exchange_repository.find_for_household(household_id)

        # Transform to exchange summaries
        exchanges.map do |exchange|
          {
            exchange_id: exchange.id,
            partner_household_id: exchange.partner_household_id(household_id),
            partner_household_name: exchange.partner_household_name(household_id),
            balance: exchange.balance_for(household_id),
            last_transaction_date: exchange.last_transaction_date
          }
        end
      end
    end
  end
end
