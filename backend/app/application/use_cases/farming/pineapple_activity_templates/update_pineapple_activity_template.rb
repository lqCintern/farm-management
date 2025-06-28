module UseCases::Farming
  module PineappleActivityTemplates
    class UpdatePineappleActivityTemplate
      def initialize(repository)
        @repository = repository
      end

      def execute(id, attributes, user_id)
        # Chuyển đổi các tham số cần thiết
        if attributes[:activity_type].present? && attributes[:activity_type].is_a?(String)
          attributes[:activity_type] = attributes[:activity_type].to_i
        end

        if attributes[:stage].present? && attributes[:stage].is_a?(String)
          # Map string stage names to integer values using the enum
          stage_mapping = {
            'preparation' => 0,
            'seedling_preparation' => 1,
            'planting' => 2,
            'leaf_tying' => 3,
            'first_fertilizing' => 4,
            'second_fertilizing' => 5,
            'flower_treatment' => 6,
            'sun_protection' => 7,
            'fruit_development' => 8,
            'harvesting' => 9,
            'sprout_collection' => 10,
            'field_cleaning' => 11
          }
          
          stage_value = stage_mapping[attributes[:stage]]
          if stage_value.nil?
            # If not found in mapping, try to convert to integer
            stage_value = attributes[:stage].to_i
          end
          attributes[:stage] = stage_value
        end

        result = @repository.update(id, attributes, user_id)

        if result.is_a?(Entities::Farming::PineappleActivityTemplate)
          { success: true, template: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
