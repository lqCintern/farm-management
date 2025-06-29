module UseCases::Labor
  module LaborRequests
    class SyncActivityStatus
      def initialize(activity_repository, labor_request_repository)
        @activity_repository = activity_repository
        @labor_request_repository = labor_request_repository
      end

      def execute(labor_request_id)
        # 1. Lấy labor request
        request_result = @labor_request_repository.find(labor_request_id)
        return { success: false, errors: ["Không tìm thấy labor request"] } unless request_result[:success]

        labor_request = request_result[:request]
        return { success: true } unless labor_request.farm_activity_id

        # 2. Lấy farm activity
        activity_result = @activity_repository.find(labor_request.farm_activity_id)
        return { success: false, errors: ["Không tìm thấy farm activity"] } unless activity_result[:success]

        farm_activity = activity_result[:activity]

        # 3. Đồng bộ status
        new_activity_status = map_labor_status_to_activity_status(labor_request.status)
        
        if new_activity_status && new_activity_status != farm_activity.status
          update_result = @activity_repository.update(farm_activity.id, { status: new_activity_status })
          
          if update_result[:success]
            Rails.logger.info "Synced labor request #{labor_request.id} status (#{labor_request.status}) to farm activity #{farm_activity.id} status (#{new_activity_status})"
            return { success: true, activity_status: new_activity_status }
          else
            return { success: false, errors: update_result[:errors] }
          end
        end

        { success: true }
      end

      private

      def map_labor_status_to_activity_status(labor_status)
        case labor_status.to_s
        when "pending"
          "pending"
        when "accepted"
          "in_progress" # Bắt đầu làm việc
        when "completed"
          "completed"
        when "cancelled"
          "pending" # Hủy tìm người nhưng activity vẫn có thể thực hiện
        when "declined"
          "pending" # Vẫn pending vì có thể tìm người khác
        else
          nil
        end
      end
    end
  end
end 