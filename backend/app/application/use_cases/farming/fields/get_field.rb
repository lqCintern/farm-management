module UseCases::Farming
  module Fields
    class GetField
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        field = @repository.find_by_id(id, user_id)

        if field
          { success: true, field: field }
        else
          { success: false, error: "Không tìm thấy cánh đồng" }
        end
      end
    end
  end
end
