module Labor
  module HouseholdWorkers
    class AddWorkerToHousehold
      def initialize(repository)
        @repository = repository
      end
      
      def execute(household_id, worker_id, params)
        household_worker_entity = Entities::Labor::HouseholdWorker.new(
          household_id: household_id,
          worker_id: worker_id,
          relationship: params[:relationship],
          joined_date: params[:joined_date] || Date.today,
          notes: params[:notes]
        )
        
        @repository.create(household_worker_entity)
      end
    end
  end
end