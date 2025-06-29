module UseCases::Farming
  module FarmActivities
    class CreateFarmActivityWithLabor
      def initialize(activity_repository, labor_request_repository, household_repository)
        @activity_repository = activity_repository
        @labor_request_repository = labor_request_repository
        @household_repository = household_repository
      end

      def execute(activity_params, user_id)
        # 1. Tạo farm activity
        activity_result = @activity_repository.create(activity_params)
        return activity_result unless activity_result[:success]

        activity = activity_result[:activity]

        # 2. Kiểm tra xem có cần tạo labor request không
        if should_create_labor_request?(activity)
          # 3. Tìm household của user
          household_result = @household_repository.find_by_owner(user_id)
          return activity_result unless household_result[:success]

          household = household_result[:household]

          # 4. Tạo labor request
          labor_request_params = build_labor_request_params(activity, household)
          labor_result = @labor_request_repository.create(labor_request_params)

          if labor_result[:success]
            Rails.logger.info "Auto-created labor request #{labor_result[:request].id} for farm activity #{activity.id}"
          else
            Rails.logger.warn "Failed to auto-create labor request for farm activity #{activity.id}: #{labor_result[:errors]}"
          end
        end

        activity_result
      end

      private

      def should_create_labor_request?(activity)
        # Logic thông minh để quyết định khi nào cần đổi công
        case activity.activity_type.to_s
        when "3" # Thu hoạch - luôn cần nhiều người
          return true
        when "2" # Bón phân - cần ít nhất 2 người
          return true
        when "4" # Phun thuốc - cần ít nhất 2 người
          return true
        when "6" # Gieo trồng - cần ít nhất 2 người
          return true
        else
          # Các hoạt động khác: kiểm tra duration
          duration_days = (Date.parse(activity.end_date) - Date.parse(activity.start_date)).to_i + 1
          return duration_days >= 2 # Nếu kéo dài 2 ngày trở lên thì cần đổi công
        end
      end

      def build_labor_request_params(activity, household)
        # Ước tính số người cần dựa trên loại hoạt động
        workers_needed = estimate_workers_needed(activity)
        
        # Tạo title thông minh
        title = generate_labor_request_title(activity)

        {
          title: title,
          description: "Cần hỗ trợ cho hoạt động: #{activity.description}",
          workers_needed: workers_needed,
          request_type: "exchange", # Mặc định là đổi công
          status: "pending",
          requesting_household_id: household.id,
          start_date: activity.start_date,
          end_date: activity.end_date,
          farm_activity_id: activity.id,
          is_public: true, # Mặc định là public để tìm người
          max_acceptors: workers_needed
        }
      end

      def estimate_workers_needed(activity)
        case activity.activity_type.to_s
        when "3" # Thu hoạch
          return 3
        when "2" # Bón phân
          return 2
        when "4" # Phun thuốc
          return 2
        when "6" # Gieo trồng
          return 2
        else
          return 1
        end
      end

      def generate_labor_request_title(activity)
        activity_type_labels = {
          "1" => "Tưới nước",
          "2" => "Bón phân",
          "3" => "Thu hoạch",
          "4" => "Phun thuốc",
          "5" => "Làm đất",
          "6" => "Gieo trồng"
        }

        type_label = activity_type_labels[activity.activity_type.to_s] || "Hoạt động"
        date_label = Date.parse(activity.start_date).strftime("%d/%m/%Y")
        
        "#{type_label} ngày #{date_label}"
      end
    end
  end
end 