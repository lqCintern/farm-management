module Services::Labor
  class LaborRequestService
    # Tạo yêu cầu đổi công thông thường (1-1)
    def self.create_request(requesting_household, params)
      result = { success: false, request: nil, errors: [] }

      request = LaborRequest.new(params)
      request.requesting_household = requesting_household

      if request.save
        result[:success] = true
        result[:request] = request
      else
        result[:errors] = request.errors.full_messages
      end

      result
    end

    # Tạo yêu cầu đổi công kết hợp (chỉ định + công khai)
    def self.create_mixed_request(requesting_household, params, provider_ids = [], options = {})
      result = { success: false, parent_request: nil, child_requests: [], errors: [] }

      # Tạo transaction để đảm bảo tính nhất quán
      ActiveRecord::Base.transaction do
        # Tạo group ID
        group_id = SecureRandom.uuid

        # Chuẩn bị params cho parent request
        parent_params = params.except(:parent_request_id, :request_group_id, :providing_household_id)

        # Tạo parent request
        parent_request = LaborRequest.new(parent_params)
        parent_request.requesting_household = requesting_household
        parent_request.request_group_id = group_id
        parent_request.is_public = options[:is_public] || false
        parent_request.max_acceptors = options[:max_acceptors]

        unless parent_request.save
          result[:errors] = parent_request.errors.full_messages
          raise ActiveRecord::Rollback
        end

        result[:parent_request] = parent_request

        # Tạo child requests cho các provider được chỉ định
        provider_ids.each do |provider_id|
          child_request = LaborRequest.new(parent_params)
          child_request.requesting_household = requesting_household
          child_request.providing_household_id = provider_id
          child_request.parent_request_id = parent_request.id
          child_request.request_group_id = group_id

          unless child_request.save
            result[:errors] << "Không thể tạo yêu cầu cho household #{provider_id}: #{child_request.errors.full_messages.join(', ')}"
          else
            result[:child_requests] << child_request
          end
        end

        # Transaction thành công
        result[:success] = result[:errors].empty?
      end

      result
    end

    # Household tham gia vào yêu cầu công khai
    def self.join_public_request(public_request, joining_household)
      result = { success: false, request: nil, errors: [] }

      # Xác minh đây là yêu cầu công khai
      unless public_request.is_public
        result[:errors] << "Yêu cầu này không phải là yêu cầu công khai"
        return result
      end

      # Tìm request cha nếu đây không phải là request cha
      parent = public_request.original_request? ? public_request : public_request.parent_request

      # Kiểm tra xem household có thể chấp nhận yêu cầu này không
      unless parent.can_be_accepted_by?(joining_household.id)
        result[:errors] << "Hộ sản xuất này không thể tham gia vào yêu cầu này"
        return result
      end

      # Kiểm tra giới hạn số lượng chấp nhận
      if parent.max_acceptors_reached?
        result[:errors] << "Yêu cầu này đã đạt giới hạn số household có thể tham gia"
        return result
      end

      # Kiểm tra xem household đã có request con chưa
      existing = parent.child_requests.find_by(providing_household_id: joining_household.id)
      if existing
        result[:errors] << "Hộ sản xuất này đã tham gia vào yêu cầu này"
        result[:request] = existing
        return result
      end

      # Tạo request con mới
      child_request = LaborRequest.new(
        title: parent.title,
        description: parent.description,
        workers_needed: parent.workers_needed,
        request_type: parent.request_type,
        rate: parent.rate,
        start_date: parent.start_date,
        end_date: parent.end_date,
        start_time: parent.start_time,
        end_time: parent.end_time,
        farm_activity_id: parent.farm_activity_id,
        requesting_household_id: parent.requesting_household_id,
        providing_household_id: joining_household.id,
        parent_request_id: parent.id,
        request_group_id: parent.request_group_id,
        status: :pending
      )

      if child_request.save
        result[:success] = true
        result[:request] = child_request
      else
        result[:errors] = child_request.errors.full_messages
      end

      result
    end

    # Cập nhật yêu cầu
    def self.update_request(request, params)
      result = { success: false, request: request, errors: [] }

      # Kiểm tra nếu request đã được chấp nhận, không cho phép thay đổi một số thông tin
      if !request.pending? && (params[:start_date].present? || params[:end_date].present?)
        result[:errors] << "Không thể thay đổi ngày của yêu cầu đã được chấp nhận"
        return result
      end

      if request.update(params)
        result[:success] = true
      else
        result[:errors] = request.errors.full_messages
      end

      result
    end

    # Xử lý request (chấp nhận, từ chối, hủy, hoàn thành)
    def self.process_request(request, action, current_user)
      result = { success: false, request: request, errors: [] }

      case action.to_sym
      when :accept
        # Chỉ chủ của providing household mới được chấp nhận
        if request.providing_household.nil? || request.providing_household.owner_id != current_user.id
          result[:errors] << "Bạn không có quyền chấp nhận yêu cầu này"
          return result
        end

        request.status = :accepted

      when :decline
        # Chỉ chủ của providing household mới được từ chối
        if request.providing_household.nil? || request.providing_household.owner_id != current_user.id
          result[:errors] << "Bạn không có quyền từ chối yêu cầu này"
          return result
        end

        request.status = :declined

      when :cancel
        # Chỉ chủ của requesting household mới được hủy
        if request.requesting_household.owner_id != current_user.id
          result[:errors] << "Bạn không có quyền hủy yêu cầu này"
          return result
        end

        # Nếu là parent request, hủy tất cả child request luôn
        if request.original_request? && request.child_requests.exists?
          request.child_requests.update_all(status: :cancelled)
        end

        request.status = :cancelled

      when :complete
        # Chỉ chủ của requesting household mới được đánh dấu hoàn thành
        if request.requesting_household.owner_id != current_user.id
          result[:errors] << "Bạn không có quyền đánh dấu hoàn thành yêu cầu này"
          return result
        end

        request.status = :completed

        # Thêm code để tìm các assignment liên quan và xử lý đổi công
        if [ :exchange, :mixed ].include?(request.request_type.to_sym)
          assignments = request.assignments.where(status: :completed)
          assignments.each do |assignment|
            exchange_result = Labor::ExchangeService.process_completed_assignment(assignment)
            unless exchange_result[:success]
              result[:exchange_errors] ||= []
              result[:exchange_errors] << exchange_result[:errors]
            end
          end
        end
      else
        result[:errors] << "Hành động không được hỗ trợ"
        return result
      end

      if request.save
        result[:success] = true

        # Cập nhật trạng thái của parent request nếu cần
        update_parent_status(request) if request.parent_request_id.present?

        # Bổ sung thông tin nhóm nếu request thuộc một nhóm
        if request.request_group_id.present?
          result[:group_status] = request.group_status
        end
      else
        result[:errors] = request.errors.full_messages
      end

      result
    end

    # Tìm các yêu cầu phù hợp với household
    def self.find_requests_for_household(household_id, filters = {})
      requests = LaborRequest.includes(:requesting_household, :providing_household)

      # Áp dụng bộ lọc
      if filters[:status].present?
        requests = requests.where(status: filters[:status])
      end

      # Tìm các yêu cầu:
      # 1. Do household này tạo
      # 2. Dành cho household này
      # 3. Yêu cầu công khai
      base_query = requests.where(
        "requesting_household_id = :id OR providing_household_id = :id OR is_public = true",
        id: household_id
      )

      # Loại bỏ child requests trừ khi được yêu cầu cụ thể
      if filters[:include_children] != true
        base_query = base_query.where(parent_request_id: nil)
      end

      # Loại bỏ yêu cầu từ nhóm đã tham gia
      if filters[:exclude_joined] == true
        joined_groups = LaborRequest.where(providing_household_id: household_id)
                                   .pluck(:request_group_id)
                                   .compact
                                   .uniq

        base_query = base_query.where.not(request_group_id: joined_groups)
      end

      base_query
    end

    # Cập nhật trạng thái của parent request dựa trên các child request
    def self.update_parent_status(child_request)
      return unless child_request.parent_request_id.present?

      parent = child_request.parent_request
      siblings = parent.child_requests

      # Nếu có bất kỳ child request nào được chấp nhận, đánh dấu parent là active
      if siblings.where(status: :accepted).exists?
        parent.update(status: :accepted)
      # Nếu tất cả child request bị từ chối, đánh dấu parent là declined
      elsif siblings.count > 0 && siblings.where(status: :declined).count == siblings.count
        parent.update(status: :declined)
      end
    end

    def self.suggest_workers(request, max_suggestions = 5)
      return [] unless request.requesting_household

      # Tìm các worker có kỹ năng phù hợp và đang khả dụng vào thời gian cần
      available_workers = Labor::WorkerProfile.where(availability: :available)
        .joins(:user)
        .where.not(users: { id: request.requesting_household.workers.pluck(:worker_id) })
        .limit(max_suggestions)

      available_workers.map(&:user)
    end
  end
end
