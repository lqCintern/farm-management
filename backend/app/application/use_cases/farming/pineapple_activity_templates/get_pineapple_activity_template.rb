module UseCases::Farming
  module PineappleActivityTemplates
    class GetPineappleActivityTemplate
      def initialize(repository)
        @repository = repository
      end

      def execute(id)
        template = @repository.find_by_id(id)

        if template
          { success: true, template: template }
        else
          { success: false, error: "Không tìm thấy mẫu hoạt động" }
        end
      end
    end
  end
end
