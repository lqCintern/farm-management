module UseCases::Farming
  module FarmActivities
    class GetFarmActivityHistoryByField
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, crop_animal_id)
        # Chúng ta cần mở rộng repository để hỗ trợ query này
        records = ::Models::Farming::FarmActivity
                  .where(user_id: user_id)
                  .where(crop_animal_id: crop_animal_id)
                  .order(start_date: :desc)

        {
          success: true,
          records: records
        }
      end
    end
  end
end
