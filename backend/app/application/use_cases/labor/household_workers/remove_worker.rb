module UseCases::Labor
  module HouseholdWorkers
    class RemoveWorker
      def initialize(worker_repository, household_repository)
        @worker_repository = worker_repository
        @household_repository = household_repository
      end

      def execute(worker_relation_id, current_user)
        worker_relation = @worker_repository.find(worker_relation_id)
        return { success: false, errors: [ "Không tìm thấy thành viên hộ" ] } unless worker_relation

        # Kiểm tra quyền xóa sử dụng household_repository
        household = @household_repository.find(worker_relation.household_id)
        unless household && household.owner_id == current_user.id
          return { success: false, errors: [ "Bạn không có quyền xóa thành viên này" ] }
        end

        success, errors = @worker_repository.delete(worker_relation_id)

        if success
          { success: true, message: "Đã xóa thành viên hộ thành công" }
        else
          { success: false, errors: errors }
        end
      end
    end
  end
end
