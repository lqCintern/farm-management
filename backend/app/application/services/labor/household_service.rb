# app/services/labor/household_service.rb
module Services::Labor
  class HouseholdService
    def self.create_household(owner_user, params)
      household = Labor::FarmHousehold.new(
        name: params[:name],
        description: params[:description],
        province: params[:province],
        district: params[:district],
        ward: params[:ward],
        address: params[:address],
        owner_id: owner_user.id
      )

      result = { success: false, household: household, errors: [] }

      Labor::FarmHousehold.transaction do
        if household.save
          # Nếu owner cũng là worker, tự động thêm vào household
          if owner_user.user_type == "worker" || owner_user.user_type == "farmer"
            worker_relation = Labor::HouseholdWorker.new(
              household: household,
              worker_id: owner_user.id,
              relationship: "owner",
              is_active: true,
              joined_date: Date.today
            )

            unless worker_relation.save
              result[:errors] += worker_relation.errors.full_messages
              raise ActiveRecord::Rollback
            end
          end

          # Tạo worker profile nếu chưa có
          unless Labor::WorkerProfile.exists?(user_id: owner_user.id)
            profile = Labor::WorkerProfile.new(user_id: owner_user.id)
            unless profile.save
              result[:errors] += profile.errors.full_messages
              raise ActiveRecord::Rollback
            end
          end

          result[:success] = true
        else
          result[:errors] = household.errors.full_messages
        end
      end

      result
    end

    def self.add_worker(household, worker_user, params)
      relation = Labor::HouseholdWorker.new(
        household: household,
        worker_id: worker_user.id,
        relationship: params[:relationship],
        is_active: true,
        joined_date: params[:joined_date] || Date.today,
        notes: params[:notes]
      )

      result = { success: false, worker_relation: relation, errors: [] }

      Labor::HouseholdWorker.transaction do
        if relation.save
          # Tạo worker profile nếu chưa có
          unless Labor::WorkerProfile.exists?(user_id: worker_user.id)
            profile = Labor::WorkerProfile.new(user_id: worker_user.id)
            unless profile.save
              result[:errors] += profile.errors.full_messages
              raise ActiveRecord::Rollback
            end
          end

          result[:success] = true
        else
          result[:errors] = relation.errors.full_messages
        end
      end

      result
    end

    def self.update_household(household, params)
      household.assign_attributes(
        name: params[:name] || household.name,
        description: params[:description] || household.description,
        province: params[:province] || household.province,
        district: params[:district] || household.district,
        ward: params[:ward] || household.ward,
        address: params[:address] || household.address
      )

      if household.save
        { success: true, household: household }
      else
        { success: false, household: household, errors: household.errors.full_messages }
      end
    end

    def self.household_summary(household)
      active_workers = Labor::HouseholdWorker.where(household_id: household.id, is_active: true).count

      total_exchanges = Labor::LaborExchange.where("household_a_id = ? OR household_b_id = ?", household.id, household.id).count

      pending_requests = Labor::LaborRequest.where(requesting_household_id: household.id, status: :pending).count

      upcoming_assignments = Labor::LaborAssignment.joins(:labor_request)
        .where(home_household_id: household.id)
        .where("work_date >= ?", Date.today)
        .count

      {
        household: household,
        active_workers_count: active_workers,
        total_exchanges: total_exchanges,
        pending_requests: pending_requests,
        upcoming_assignments: upcoming_assignments
      }
    end
  end
end
