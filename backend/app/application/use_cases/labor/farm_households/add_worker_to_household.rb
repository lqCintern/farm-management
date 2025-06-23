module UseCases::Labor
  module FarmHouseholds
    class AddWorkerToHousehold
      def initialize(repository)
        @repository = repository
      end

      def execute(household_id, worker_id, params)
        result = { success: false, worker_relation: nil, errors: [] }

        ActiveRecord::Base.transaction do
          worker_relation, errors = @repository.add_worker(household_id, worker_id, params)

          if worker_relation
            # Tạo worker profile nếu chưa có
            unless ::Labor::WorkerProfile.exists?(user_id: worker_id)
              profile = ::Models::Labor::WorkerProfile.new(user_id: worker_id)
              unless profile.save
                result[:errors] += profile.errors.full_messages
                raise ActiveRecord::Rollback
              end
            end

            result[:success] = true
            result[:worker_relation] = worker_relation
          else
            result[:errors] = errors
            raise ActiveRecord::Rollback
          end
        end

        result
      end
    end
  end
end
