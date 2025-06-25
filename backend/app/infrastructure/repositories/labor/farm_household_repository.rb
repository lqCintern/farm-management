module Repositories
  module Labor
    class FarmHouseholdRepository
      include ::Interfaces::Repositories::Labor::FarmHouseholdRepositoryInterface

      def find(id)
        # Tìm record trong database
        record = ::Models::Labor::FarmHousehold.find_by(id: id)
        return { success: false, errors: [ "Không tìm thấy hộ gia đình" ] } unless record

        # Map sang entity và trả về kết quả theo format chuẩn
        entity = map_to_entity(record)
        { success: true, household: entity }
      end

      def all
        Models::Labor::FarmHousehold.all.map { |record| map_to_entity(record) }
      end

      def create(household_entity)
        record = ::Models::Labor::FarmHousehold.new(
          name: household_entity.name,
          description: household_entity.description,
          province: household_entity.province,
          district: household_entity.district,
          ward: household_entity.ward,
          address: household_entity.address,
          owner_id: household_entity.owner_id
        )

        if record.save
          [ map_to_entity(record), [] ]
        else
          [ nil, record.errors.full_messages ]
        end
      end

      def update(household_entity)
        record = ::Models::Labor::FarmHousehold.find_by(id: household_entity.id)
        return [ nil, [ "Không tìm thấy hộ sản xuất" ] ] unless record

        record.assign_attributes(
          name: household_entity.name,
          description: household_entity.description,
          province: household_entity.province,
          district: household_entity.district,
          ward: household_entity.ward,
          address: household_entity.address
        )

        if record.save
          [ map_to_entity(record), [] ]
        else
          [ nil, record.errors.full_messages ]
        end
      end

      def delete(id)
        record = ::Models::Labor::FarmHousehold.find_by(id: id)
        return [ false, "Không tìm thấy hộ sản xuất" ] unless record

        if record.destroy
          [ true, nil ]
        else
          [ false, record.errors.full_messages ]
        end
      end

      def get_summary(id)
        record = ::Models::Labor::FarmHousehold.find_by(id: id)
        return nil unless record

        active_workers = ::Models::Labor::HouseholdWorker.where(household_id: id, is_active: true).count
        total_exchanges = ::Models::Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?", id, id).count
        pending_requests = ::Models::Labor::LaborRequest.where(requesting_household_id: id, status: :pending).count
        upcoming_assignments = ::Models::Labor::LaborAssignment.joins(:labor_request)
          .where(home_household_id: id)
          .where("work_date >= ?", Date.today)
          .count

        Entities::Labor::HouseholdSummary.new(
          household: map_to_entity(record),
          active_workers_count: active_workers,
          total_exchanges: total_exchanges,
          pending_requests: pending_requests,
          upcoming_assignments: upcoming_assignments
        )
      end

      def add_worker(household_id, worker_id, params)
        household_record = ::Models::Labor::FarmHousehold.find_by(id: household_id)
        return [ nil, [ "Không tìm thấy hộ sản xuất" ] ] unless household_record

        relation = ::Models::Labor::HouseholdWorker.new(
          household_id: household_id,
          worker_id: worker_id,
          relationship: params[:relationship],
          is_active: true,
          joined_date: params[:joined_date] || Date.today,
          notes: params[:notes]
        )

        if relation.save
          [ relation, [] ]
        else
          [ nil, relation.errors.full_messages ]
        end
      end

      private

      def map_to_entity(record)
        Entities::Labor::FarmHousehold.new(
          id: record.id,
          name: record.name,
          description: record.description,
          province: record.province,
          district: record.district,
          ward: record.ward,
          address: record.address,
          owner_id: record.owner_id
        )
      end
    end
  end
end
