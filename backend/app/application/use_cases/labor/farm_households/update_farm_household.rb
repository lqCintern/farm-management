module UseCases::Labor
  module FarmHouseholds
    class UpdateFarmHousehold
      def initialize(repository)
        @repository = repository
      end

      def execute(id, params)
        result = @repository.find(id)
        return { success: false, errors: [ "Không tìm thấy hộ sản xuất" ] } unless result[:success]
        
        household_entity = result[:household]
        household_entity.name = params[:name] || household_entity.name
        household_entity.description = params[:description] || household_entity.description
        household_entity.province = params[:province] || household_entity.province
        household_entity.district = params[:district] || household_entity.district
        household_entity.ward = params[:ward] || household_entity.ward
        household_entity.address = params[:address] || household_entity.address

        updated_household, errors = @repository.update(household_entity)

        if updated_household
          { success: true, household: updated_household }
        else
          { success: false, errors: errors || [ "Không thể cập nhật hộ sản xuất" ] }
        end
      end
    end
  end
end
