module UseCases::Farming
  module PineappleActivityTemplates
    class CreatePineappleActivityTemplate
      def initialize(repository)
        @repository = repository
      end

      def execute(attributes, user_id)
        # Chuyển đổi các tham số cần thiết
        if attributes[:activity_type].present? && attributes[:activity_type].is_a?(String)
          attributes[:activity_type] = attributes[:activity_type].to_i
        end

        if attributes[:stage].present? && attributes[:stage].is_a?(String)
          attributes[:stage] = attributes[:stage].to_i
        end

        result = @repository.create(attributes, user_id)

        if result.is_a?(Entities::Farming::PineappleActivityTemplate)
          { success: true, template: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
