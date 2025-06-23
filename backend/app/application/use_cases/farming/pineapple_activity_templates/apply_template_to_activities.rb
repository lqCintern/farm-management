module UseCases::Farming
  module PineappleActivityTemplates
    class ApplyTemplateToActivities
      def initialize(repository)
        @repository = repository
      end

      def execute(template_id, crop_id, user_id)
        @repository.create_activity_from_template(template_id, crop_id, user_id)
      end
    end
  end
end
