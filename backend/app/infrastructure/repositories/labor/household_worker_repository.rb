module Repositories
  module Labor
    class HouseholdWorkerRepository
      include HouseholdWorkerRepositoryInterface
      
      def find(id)
        record = ::Labor::HouseholdWorker.find_by(id: id)
        return nil unless record
        map_to_entity(record)
      end
      
      def find_by_household(household_id)
        records = ::Labor::HouseholdWorker.where(household_id: household_id)
                                        .includes(:worker)
                                        .active
        
        records.map do |record|
          worker_profile = ::Labor::WorkerProfile.find_by(user_id: record.worker_id)
          {
            id: record.id,
            worker_id: record.worker_id,
            name: record.worker.fullname || record.worker.user_name,
            relationship: record.relationship,
            skills: worker_profile&.skills || [],
            joined_date: record.joined_date,
            is_active: record.is_active
          }
        end
      end
      
      def create(household_worker_entity)
        record = ::Labor::HouseholdWorker.new(
          household_id: household_worker_entity.household_id,
          worker_id: household_worker_entity.worker_id,
          relationship: household_worker_entity.relationship,
          is_active: household_worker_entity.is_active,
          joined_date: household_worker_entity.joined_date,
          notes: household_worker_entity.notes
        )
        
        result = { success: false, worker_relation: nil, errors: [] }
        
        ActiveRecord::Base.transaction do
          if record.save
            # Tạo worker profile nếu chưa có
            unless ::Labor::WorkerProfile.exists?(user_id: record.worker_id)
              profile = ::Labor::WorkerProfile.new(user_id: record.worker_id)
              unless profile.save
                result[:errors] += profile.errors.full_messages
                raise ActiveRecord::Rollback
              end
            end
            
            result[:success] = true
            result[:worker_relation] = map_to_entity(record)
          else
            result[:errors] = record.errors.full_messages
          end
        end
        
        result
      end
      
      def update(household_worker_entity)
        record = ::Labor::HouseholdWorker.find_by(id: household_worker_entity.id)
        return [nil, ["Không tìm thấy thành viên hộ"]] unless record
        
        record.assign_attributes(
          relationship: household_worker_entity.relationship,
          is_active: household_worker_entity.is_active,
          joined_date: household_worker_entity.joined_date,
          notes: household_worker_entity.notes
        )
        
        if record.save
          [map_to_entity(record), []]
        else
          [nil, record.errors.full_messages]
        end
      end
      
      def delete(id)
        record = ::Labor::HouseholdWorker.find_by(id: id)
        return [false, ["Không tìm thấy thành viên hộ"]] unless record
        
        if record.destroy
          [true, []]
        else
          [false, record.errors.full_messages]
        end
      end
      
      def update_status(id, is_active)
        record = ::Labor::HouseholdWorker.find_by(id: id)
        return [nil, ["Không tìm thấy thành viên hộ"]] unless record
        
        if is_active
          record.activate!
        else
          record.deactivate!
        end
        
        [map_to_entity(record), []]
      end
      
      private
      
      def map_to_entity(record)
        Entities::Labor::HouseholdWorker.new(
          id: record.id,
          household_id: record.household_id,
          worker_id: record.worker_id,
          relationship: record.relationship,
          is_active: record.is_active,
          joined_date: record.joined_date,
          notes: record.notes
        )
      end
    end
  end
end
