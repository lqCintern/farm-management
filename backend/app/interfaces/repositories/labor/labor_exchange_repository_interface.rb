module Repositories
  module Labor
    module LaborExchangeRepositoryInterface
      def find(id)
        raise NotImplementedError
      end
      
      def find_for_household(household_id)
        raise NotImplementedError
      end
      
      def find_by_households(household_a_id, household_b_id)
        raise NotImplementedError
      end
      
      def find_or_create_between(household_a_id, household_b_id)
        raise NotImplementedError
      end
      
      def update_balance(exchange_id, new_balance, transaction_description = nil)
        raise NotImplementedError
      end
      
      def reset_balance(exchange_id)
        raise NotImplementedError
      end
      
      def get_transactions(exchange_id, options = {})
        raise NotImplementedError
      end
      
      def add_transaction(exchange_id, hours, description, assignment_id = nil)
        raise NotImplementedError
      end
      
      def process_assignment(assignment_id)
        raise NotImplementedError
      end
      
      def recalculate_balance(household_a_id, household_b_id)
        raise NotImplementedError
      end
      
      def delete_all_transactions(exchange_id)
        raise NotImplementedError
      end
    end
  end
end
