module UseCases::Labor
  module HouseholdWorkers
    class UpdateWorkerStatus
      def initialize(worker_repository, household_repository)
        @worker_repository = worker_repository
        @household_repository = household_repository
      end

      def execute(worker_relation_id, is_active, current_user)
        worker_relation = @worker_repository.find(worker_relation_id)
        return { success: false, errors: [ "Không tìm thấy thành viên hộ" ] } unless worker_relation

        # Sử dụng household_repository thay vì truy cập trực tiếp
        household = @household_repository.find(worker_relation.household_id)
        unless household && household.owner_id == current_user.id
          return { success: false, errors: [ "Bạn không có quyền cập nhật trạng thái này" ] }
        end

        # Sửa từ @repository sang @worker_repository
        updated_relation, errors = @worker_repository.update_status(worker_relation_id, is_active)

        if updated_relation
          { success: true, worker_relation: updated_relation }
        else
          { success: false, errors: errors }
        end
      end
    end
  end
end
