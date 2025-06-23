module UseCases::Labor
  module LaborExchanges
    class RecalculateAllBalances
      def initialize(repository)
        @repository = repository
      end

      def execute(household_id)
        # Get list of all households with exchanges with current household
        exchanges = ::Models::Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?",
                                           household_id, household_id)

        results = []

        exchanges.each do |exchange|
          # Determine partner household ID
          partner_id = exchange.household_a_id == household_id ?
                       exchange.household_b_id : exchange.household_a_id

          # Recalculate balance
          result = @repository.recalculate_balance(household_id, partner_id)

          if result[:success]
            results << {
              household_id: partner_id,
              household_name: partner_id == exchange.household_a_id ?
                            exchange.household_a.name : exchange.household_b.name,
              old_balance: result[:old_balance],
              new_balance: result[:new_balance],
              difference: result[:diff]
            }
          end
        end

        { success: true, results: results }
      end
    end
  end
end
