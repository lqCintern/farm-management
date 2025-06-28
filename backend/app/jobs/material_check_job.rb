class MaterialCheckJob < ApplicationJob
  queue_as :default

  def perform
    # Kiểm tra các hoạt động sẽ diễn ra trong 1 ngày tới
    tomorrow = Date.tomorrow
    activities_tomorrow = FarmActivity.where(start_date: tomorrow, status: "pending")
                                     .includes(:activity_materials => :farm_material)

    material_service = Services::Farming::MaterialManagementService.new

    activities_tomorrow.each do |activity|
      next unless activity.requires_materials?

      # Kiểm tra vật tư
      can_start, insufficient_materials = material_service.check_materials_before_execution(activity, 1)
      
      unless can_start
        Rails.logger.info "Thiếu vật tư cho hoạt động #{activity.id}: #{insufficient_materials.join(', ')}"
      end
    end

    # Kiểm tra các hoạt động sẽ diễn ra trong 3 ngày tới
    three_days_later = 3.days.from_now.to_date
    activities_three_days = FarmActivity.where(start_date: three_days_later, status: "pending")
                                       .includes(:activity_materials => :farm_material)

    activities_three_days.each do |activity|
      next unless activity.requires_materials?

      # Kiểm tra vật tư
      can_start, insufficient_materials = material_service.check_materials_before_execution(activity, 3)
      
      unless can_start
        Rails.logger.info "Thiếu vật tư cho hoạt động #{activity.id} (3 ngày): #{insufficient_materials.join(', ')}"
      end
    end
  end
end 