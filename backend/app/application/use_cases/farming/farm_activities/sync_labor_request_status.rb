module UseCases::Farming
  module FarmActivities
    class SyncLaborRequestStatus
      def initialize(activity_repository, labor_request_repository)
        @activity_repository = activity_repository
        @labor_request_repository = labor_request_repository
      end

      def execute(farm_activity_id)
        # 1. Lấy farm activity
        activity_result = @activity_repository.find_by_id(farm_activity_id)
        return { success: false, errors: ["Không tìm thấy farm activity"] } unless activity_result

        farm_activity = activity_result

        # 2. Tìm labor requests liên quan
        labor_requests = ::Models::Labor::LaborRequest.where(farm_activity_id: farm_activity_id)
        return { success: true } if labor_requests.empty?

        # 3. Đồng bộ status
        new_labor_status = map_activity_status_to_labor_status(farm_activity.status)
        
        if new_labor_status
          labor_requests.each do |labor_request|
            if labor_request.status != new_labor_status
              @labor_request_repository.update(labor_request.id, { status: new_labor_status })
              Rails.logger.info "Synced farm activity #{farm_activity_id} status (#{farm_activity.status}) to labor request #{labor_request.id} status (#{new_labor_status})"
            end
          end
        end

        { success: true }
      end

      private

      def map_activity_status_to_labor_status(activity_status)
        case activity_status.to_s
        when "pending"
          "pending"
        when "in_progress"
          "accepted" # Khi activity bắt đầu thì labor request đã được accept
        when "completed"
          "completed"
        when "cancelled"
          "cancelled"
        else
          nil
        end
      end
    end
  end
end 