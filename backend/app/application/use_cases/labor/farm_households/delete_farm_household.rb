module UseCases::Labor
  module FarmHouseholds
    class DeleteFarmHousehold
      def initialize(repository)
        @repository = repository
      end

      def execute(id)
        success, error = @repository.delete(id)

        if success
          { success: true, message: "Đã xóa hộ sản xuất thành công" }
        else
          { success: false, errors: [ error ].flatten }
        end
      end
    end
  end
end
