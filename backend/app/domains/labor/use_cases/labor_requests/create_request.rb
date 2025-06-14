module Labor
  module LaborRequests
    class CreateRequest
      def initialize(request_repository, household_repository)
        @request_repository = request_repository
        @household_repository = household_repository
      end
      
      def execute(household_id, params)
        # Verify household exists
        household_result = @household_repository.find(household_id)
        
        # Xử lý kết quả theo đúng định dạng trả về
        if household_result.is_a?(Hash)
          # Nếu kết quả là hash, kiểm tra success và lấy household từ kết quả
          return { success: false, errors: ["Không tìm thấy hộ sản xuất"] } unless household_result[:success]
          household = household_result[:household]
        else
          # Nếu kết quả là entity trực tiếp
          household = household_result
        end
        
        # Kiểm tra nếu household không hợp lệ
        return { success: false, errors: ["Không tìm thấy hộ sản xuất"] } unless household && household.id
        
        # Create entity and validate
        request_entity = Entities::Labor::LaborRequest.new(
          params.merge(requesting_household_id: household_id)
        )
        
        validation_errors = request_entity.validate
        return { success: false, errors: validation_errors } if validation_errors.any?
        
        # Create request
        @request_repository.create(request_entity)
      end
    end
  end
end
