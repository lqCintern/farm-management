module Notification
  class PrepareLaborRequestNotification
    def initialize(household_repository)
      @household_repository = household_repository
    end
    
    def execute(request_entity)
      # Lấy thông tin hộ yêu cầu
      requesting_household_result = @household_repository.find(request_entity.requesting_household_id)
      requesting_household = if requesting_household_result.is_a?(Hash)
        requesting_household_result[:success] ? requesting_household_result[:household] : nil
      else
        requesting_household_result
      end
      
      # Lấy thông tin hộ cung cấp nếu có
      providing_household = nil
      if request_entity.providing_household_id
        providing_household_result = @household_repository.find(request_entity.providing_household_id)
        providing_household = if providing_household_result.is_a?(Hash)
          providing_household_result[:success] ? providing_household_result[:household] : nil
        else
          providing_household_result
        end
      end
      
      # Tạo và trả về DTO thông báo
      Dtos::Notification::LaborRequestNotificationDto.new(
        id: request_entity.id,
        title: request_entity.title,
        description: request_entity.description,
        start_date: request_entity.start_date,
        end_date: request_entity.end_date,
        requesting_household_id: request_entity.requesting_household_id,
        requesting_household_name: requesting_household&.name,
        providing_household_id: request_entity.providing_household_id,
        providing_household_name: providing_household&.name
      )
    end
  end
end