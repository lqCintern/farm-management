module Labor
  module LaborExchanges
    class AdjustBalance
      def initialize(exchange_repository, household_repository)
        @exchange_repository = exchange_repository
        @household_repository = household_repository
      end
      
      def execute(household_a_id, household_b_id, hours, notes)
        # Input validation
        if hours.nil? || hours == 0
          return { success: false, errors: ["Giá trị công không hợp lệ"] }
        end
        
        if notes.blank?
          return { success: false, errors: ["Cần nhập lý do điều chỉnh"] }
        end
        
        # Find or create exchange
        result = @exchange_repository.find_or_create_between(household_a_id, household_b_id)
        return result unless result[:success]
        
        exchange = result[:exchange]
        
        # Ensure we're adjusting from household_a's perspective
        if exchange.household_a_id != household_a_id
          hours = -hours # Invert hours if perspective is from household_b
        end
        
        # Create transaction with description
        description = "Điều chỉnh thủ công: #{notes}"
        @exchange_repository.add_transaction(exchange.id, hours, description)
      end
    end
  end
end
