module Labor
  module LaborExchanges
    class InitializeExchanges
      def initialize(exchange_repository, assignment_repository)
        @exchange_repository = exchange_repository
        @assignment_repository = assignment_repository
      end
      
      def execute(household_id)
        # Find all households that have worked with this household
        related_households = @assignment_repository.find_related_households(household_id)
        
        results = []
        
        # Calculate exchange for each household pair
        related_households.each do |partner_id|
          result = @exchange_repository.recalculate_balance(household_id, partner_id)
          
          if result[:success]
            partner_name = result[:exchange].partner_household_name(household_id)
            
            results << {
              household_id: partner_id,
              household_name: partner_name,
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
