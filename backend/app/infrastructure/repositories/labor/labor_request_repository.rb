module Repositories
  module Labor
    class LaborRequestRepository
      include LaborRequestRepositoryInterface
      
      def find(id)
        record = ::Labor::LaborRequest
          .joins("LEFT JOIN labor_farm_households as requesting_household ON labor_requests.requesting_household_id = requesting_household.id")
          .joins("LEFT JOIN labor_farm_households as providing_household ON labor_requests.providing_household_id = providing_household.id")
          .select("labor_requests.*, requesting_household.name as requesting_household_name, providing_household.name as providing_household_name")
          .find_by(id: id)
        
        return { success: false, errors: ["Không tìm thấy yêu cầu"] } unless record
        
        { success: true, request: map_to_entity_with_names(record) }
      end
      
      def find_for_household(household_id, filters = {})
        requests = ::Labor::LaborRequest.includes(:requesting_household, :providing_household)
        
        # Áp dụng bộ lọc
        if filters[:status].present?
          requests = requests.where(status: filters[:status])
        end
        
        # Tìm các yêu cầu:
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
          joined_groups = ::Labor::LaborRequest.where(providing_household_id: household_id)
                                            .pluck(:request_group_id)
                                            .compact
                                            .uniq
          
          base_query = base_query.where.not(request_group_id: joined_groups)
        end
        
        base_query.map { |record| map_to_entity(record) }
      end
      
      def find_public_requests(filters = {})
        query = ::Labor::LaborRequest.where(is_public: true, status: :pending)
        
        # Apply filters
        if filters[:date_range].present?
          start_date = filters[:date_range][:start]
          end_date = filters[:date_range][:end] || start_date
          
          query = query.where(
            "(start_date <= :end_date AND end_date >= :start_date)",
            start_date: start_date, end_date: end_date
          )
        end
        
        if filters[:requesting_household_id].present?
          query = query.where(requesting_household_id: filters[:requesting_household_id])
        end
        
        # Exclude household's own requests
        if filters[:exclude_household_id].present?
          query = query.where.not(requesting_household_id: filters[:exclude_household_id])
        end
        
        query.includes(:requesting_household).map { |record| map_to_entity(record) }
      end
      
      def find_related_requests(request_id)
        request = ::Labor::LaborRequest.find_by(id: request_id)
        return [] unless request
        
        if request.parent_request_id.present?
          # Find siblings (other requests with the same parent)
          related = ::Labor::LaborRequest.where(parent_request_id: request.parent_request_id)
                                      .where.not(id: request_id)
        elsif request.request_group_id.present?
          # Find children (requests that have this request as parent)
          related = ::Labor::LaborRequest.where(parent_request_id: request_id)
        else
          related = ::Labor::LaborRequest.none
        end
        
        related.map { |record| map_to_entity(record) }
      end
      
      def find_by_farm_activity(household_id, farm_activity_id)
        records = ::Labor::LaborRequest.where(farm_activity_id: farm_activity_id)
                                     .where("requesting_household_id = :hid OR providing_household_id = :hid",
                                            hid: household_id)
                                     .includes(:requesting_household, :providing_household)
        
        records.map { |record| map_to_entity(record) }
      end
      
      # Cách repository nên nhận entity trong phiên bản chuẩn hóa
      def create(request_entity)
        record = ::Labor::LaborRequest.new(
          title: request_entity.title,
          description: request_entity.description,
          request_type: request_entity.request_type,
          status: request_entity.status || 'pending',
          requesting_household_id: request_entity.requesting_household_id,
          providing_household_id: request_entity.providing_household_id,
          start_date: request_entity.start_date,
          end_date: request_entity.end_date,
          start_time: request_entity.start_time,
          end_time: request_entity.end_time,
          workers_needed: request_entity.workers_needed,
          is_public: request_entity.is_public || false,
          parent_request_id: request_entity.parent_request_id,
          request_group_id: request_entity.request_group_id,
          max_acceptors: request_entity.max_acceptors,
          farm_activity_id: request_entity.farm_activity_id,
          rate: request_entity.rate
        )
        
        if record.save
          { success: true, request: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end
      
      def update(id, attributes)
        record = ::Labor::LaborRequest.find_by(id: id)
        return { success: false, errors: ["Không tìm thấy yêu cầu lao động"] } unless record
        
        # Nếu yêu cầu đã được chấp nhận, không cho phép sửa đổi một số trường nhất định
        if record.status != 'pending' && (attributes[:start_date].present? || attributes[:end_date].present?)
          return { success: false, errors: ["Không thể thay đổi ngày của yêu cầu đã được chấp nhận"] }
        end
        
        if record.update(attributes)
          { success: true, request: map_to_entity(record) }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end
      
      def delete(id)
        record = ::Labor::LaborRequest.find_by(id: id)
        return { success: false, errors: ["Không tìm thấy yêu cầu lao động"] } unless record
        
        if record.destroy
          { success: true }
        else
          { success: false, errors: record.errors.full_messages }
        end
      end
      
      def get_group_status(request_id)
        request = ::Labor::LaborRequest.find_by(id: request_id)
        return { success: false, errors: ["Không tìm thấy yêu cầu lao động"] } unless request
        
        if request.request_group_id.blank?
          return { success: false, errors: ["Yêu cầu này không thuộc nhóm nào"] }
        end
        
        # Get all requests in the same group
        group_requests = ::Labor::LaborRequest.where(request_group_id: request.request_group_id)
        
        status = {
          group_id: request.request_group_id,
          parent_id: request.parent_request_id.nil? ? request_id : request.parent_request_id,
          total: group_requests.count,
          accepted: group_requests.where(status: :accepted).count,
          declined: group_requests.where(status: :declined).count,
          pending: group_requests.where(status: :pending).count,
          completed: group_requests.where(status: :completed).count,
          cancelled: group_requests.where(status: :cancelled).count
        }
        
        { success: true, status: status }
      end
      
      def create_group_requests(requesting_household_id, provider_ids, params, options = {})
        result = { 
          success: false, 
          parent_request: nil, 
          child_requests: [],
          errors: [] 
        }
        
        # Tạo transaction để đảm bảo tính nhất quán
        ActiveRecord::Base.transaction do
          # Tạo group ID
          group_id = SecureRandom.uuid
          
          # Chuẩn bị params cho parent request
          parent_params = params.except(:parent_request_id, :request_group_id, :providing_household_id)
          parent_params[:requesting_household_id] = requesting_household_id
          parent_params[:request_group_id] = group_id
          parent_params[:is_public] = options[:is_public] || false
          parent_params[:max_acceptors] = options[:max_acceptors]
          
          # Create parent request
          parent_result = create(parent_params)
          
          unless parent_result[:success]
            result[:errors] = parent_result[:errors]
            raise ActiveRecord::Rollback
          end
          
          result[:parent_request] = parent_result[:request]
          
          # Create child requests for each provider
          provider_ids.each do |provider_id|
            child_params = parent_params.dup
            child_params[:providing_household_id] = provider_id
            child_params[:parent_request_id] = parent_result[:request][:id]
            
            child_result = create(child_params)
            
            if child_result[:success]
              result[:child_requests] << child_result[:request]
            else
              result[:errors] << "Không thể tạo yêu cầu cho household #{provider_id}: #{child_result[:errors].join(', ')}"
            end
          end
          
          # If we have errors but also created some child requests, we still consider it a success
          result[:success] = result[:parent_request].present?
        end
        
        result
      end
      
      def can_household_join_request(request_id, household_id)
        request = ::Labor::LaborRequest.find_by(id: request_id)
        return [false, "Không tìm thấy yêu cầu gốc"] unless request
        
        # Kiểm tra xem là public request không
        unless request.is_public
          return [false, "Yêu cầu này không phải là yêu cầu công khai"]
        end
        
        # Kiểm tra giới hạn số household tham gia
        if request.max_acceptors.present?
          # Count accepted and completed requests in the group
          accepted_count = ::Labor::LaborRequest.where(
            request_group_id: request.request_group_id,
            status: [:accepted, :completed]
          ).count
          
          if accepted_count >= request.max_acceptors
            return [false, "Yêu cầu này đã đạt giới hạn số household có thể tham gia"]
          end
        end
        
        # Kiểm tra xem household đã tham gia chưa
        existing = ::Labor::LaborRequest.exists?(
          request_group_id: request.request_group_id,
          providing_household_id: household_id
        )
        
        if existing
          return [false, "Hộ sản xuất này đã tham gia vào yêu cầu này"]
        end
        
        [true, nil]
      end
      
      def has_pending_assignments(request_id)
        ::Labor::LaborAssignment.exists?(
          labor_request_id: request_id,
          status: [:pending, :assigned, :accepted, :worker_reported]
        )
      end

      def update_parent_status(child_request_id)
        child_request = ::Labor::LaborRequest.find_by(id: child_request_id)
        return nil unless child_request&.parent_request_id
        
        # Find the parent request
        parent_id = child_request.parent_request_id
        parent_request = ::Labor::LaborRequest.find_by(id: parent_id)
        return nil unless parent_request
        
        # Get all siblings (including the child request itself)
        siblings = ::Labor::LaborRequest.where(parent_request_id: parent_id)
        
        new_status = nil
        
        # If any child request is accepted, mark parent as accepted
        if siblings.where(status: :accepted).exists?
          new_status = :accepted
        # If all child requests are declined, mark parent as declined
        elsif siblings.count > 0 && siblings.where(status: :declined).count == siblings.count
          new_status = :declined
        # If all child requests are cancelled, mark parent as cancelled
        elsif siblings.count > 0 && siblings.where(status: :cancelled).count == siblings.count
          new_status = :cancelled
        # If any child request is completed, mark parent as completed
        elsif siblings.where(status: :completed).exists?
          new_status = :completed
        end
        
        # Update parent status if needed
        if new_status && parent_request.status != new_status.to_s
          parent_request.update(status: new_status)
          map_to_entity(parent_request)
        else
          nil
        end
      end
      
      private
      
      def map_to_entity(record)
        Entities::Labor::LaborRequest.new(
          id: record.id,
          title: record.title,
          description: record.description,
          request_type: record.request_type,
          status: record.status,
          requesting_household_id: record.requesting_household_id,
          providing_household_id: record.providing_household_id,
          start_date: record.start_date,
          end_date: record.end_date,
          start_time: record.start_time,
          end_time: record.end_time,
          workers_needed: record.workers_needed,
          is_public: record.is_public,
          parent_request_id: record.parent_request_id,
          request_group_id: record.request_group_id,
          max_acceptors: record.max_acceptors,
          farm_activity_id: record.farm_activity_id,
          rate: record.rate,
          created_at: record.created_at,
          updated_at: record.updated_at
        )
      end

      def map_to_entity_with_names(record)
        Entities::Labor::LaborRequest.new(
          id: record.id,
          title: record.title,
          description: record.description,
          request_type: record.request_type,
          status: record.status,
          requesting_household_id: record.requesting_household_id,
          providing_household_id: record.providing_household_id,
          requesting_household_name: record.requesting_household_name,
          providing_household_name: record.providing_household_name,
          start_date: record.start_date,
          end_date: record.end_date,
          start_time: record.start_time,
          end_time: record.end_time,
          workers_needed: record.workers_needed,
          skill_requirements: record.respond_to?(:skill_requirements) ? record.skill_requirements : nil,
          is_public: record.is_public,
          parent_request_id: record.parent_request_id,
          request_group_id: record.request_group_id,
          max_acceptors: record.max_acceptors,
          farm_activity_id: record.farm_activity_id,
          rate: record.rate,
          created_at: record.created_at,
          updated_at: record.updated_at
        )
      end
    end
  end
end
