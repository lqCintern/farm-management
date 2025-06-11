module Labor
  module FarmHouseholds
    class CreateFarmHousehold
      def initialize(repository )
        @repository = repository
      end
      
      def execute(user, params)
        household_entity = Entities::Labor::FarmHousehold.new(
          name: params[:name],
          description: params[:description],
          province: params[:province],
          district: params[:district],
          ward: params[:ward],
          address: params[:address],
          owner_id: user.id
        )
        
        result = { success: false, household: nil, errors: [] }
        
        ActiveRecord::Base.transaction do
          household, errors = @repository.create(household_entity)
          
          if household
            # Nếu owner cũng là worker/farmer, tự động thêm vào household
            if user.user_type == "worker" || user.user_type == "farmer"
              worker_relation = ::Labor::HouseholdWorker.new(
                household_id: household.id,
                worker_id: user.id,
                relationship: "owner",
                is_active: true,
                joined_date: Date.today
              )
              
              unless worker_relation.save
                result[:errors] += worker_relation.errors.full_messages
                raise ActiveRecord::Rollback
              end
            end
            
            # Tạo worker profile nếu chưa có
            unless ::Labor::WorkerProfile.exists?(user_id: user.id)
              profile = ::Labor::WorkerProfile.new(user_id: user.id)
              unless profile.save
                result[:errors] += profile.errors.full_messages
                raise ActiveRecord::Rollback
              end
            end
            
            result[:success] = true
            result[:household] = household
          else
            result[:errors] = errors || ["Không thể tạo hộ sản xuất"]
            raise ActiveRecord::Rollback
          end
        end
        
        result
      end
    end
  end
end
