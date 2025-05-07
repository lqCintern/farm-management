module Api
  module V1
    class FieldsController < Api::BaseController
      before_action :set_field, only: [:show, :update, :destroy, :activities, :harvests, :crops]

      # GET /api/v1/fields
      def index
        fields = current_user.fields.order(created_at: :desc)

        render json: {
          message: "Fields retrieved successfully",
          data: fields.map { |f| field_response(f) }
        }
      end

      # GET /api/v1/fields/:id
      def show
        render json: {
          message: "Field retrieved successfully",
          data: field_response(@field)
        }
      end

      # POST /api/v1/fields
      def create
        field = current_user.fields.new(field_params)

        if field_params[:area].present?
          field.area = field_params[:area]
        else
          field.area = field.calculate_area if field.coordinates.present?
        end

        if field.save
          render json: {
            message: "Field created successfully",
            data: field_response(field)
          }, status: :created
        else
          render json: { errors: field.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/fields/:id
      def update
        # Tính diện tích tự động từ tọa độ nếu có thay đổi
        if field_params[:coordinates].present?
          # Cần gán tạm để tính diện tích
          @field.assign_attributes(field_params)
          @field.area = field_params[:area] || field.calculate_area
        end

        if @field.update(field_params)
          render json: {
            message: "Field updated successfully",
            data: field_response(@field)
          }
        else
          render json: { errors: @field.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/fields/:id
      def destroy
        if @field.crop_animals.exists? || @field.farm_activities.exists? || @field.harvests.exists?
          render json: { 
            error: "Cannot delete field. It has associated crops, activities or harvests." 
          }, status: :unprocessable_entity
          return
        end
        
        @field.destroy
        render json: {
          message: "Field deleted successfully"
        }
      end

      # GET /api/v1/fields/:id/activities
      def activities
        activities = @field.farm_activities
                          .includes(:crop_animal, :user)
                          .order(start_date: :desc)
        
        render json: {
          message: "Field activities retrieved successfully",
          data: activities.map { |a| activity_response(a) }
        }
      end

      # GET /api/v1/fields/:id/harvests
      def harvests
        harvests = @field.harvests
                        .includes(:crop_animal, :user)
                        .order(harvest_date: :desc)
        
        render json: {
          message: "Field harvests retrieved successfully",
          data: harvests.map { |h| harvest_response(h) }
        }
      end

      # GET /api/v1/fields/:id/crops
      def crops
        crops = @field.crop_animals

        render json: {
          message: "Field crops retrieved successfully",
          data: crops.map { |c| crop_response(c) }
        }
      end

      # GET /api/v1/fields/stats
      def stats
        # Thống kê theo diện tích
        total_area = current_user.fields.sum(:area)
        
        # Thống kê theo cây trồng
        crops_by_field = current_user.fields
                                    .joins(:crop_animals)
                                    .group("fields.id")
                                    .count("crop_animals.id")
        
        # Thống kê hoạt động
        activities_by_field = current_user.fields
                                        .joins(:farm_activities)
                                        .group("fields.id")
                                        .count("farm_activities.id")
        
        # Thống kê thu hoạch
        harvests_by_field = current_user.fields
                                      .joins(:harvests)
                                      .group("fields.id")
                                      .sum("harvests.quantity")
        
        render json: {
          message: "Field statistics retrieved successfully",
          data: {
            total_fields: current_user.fields.count,
            total_area: total_area,
            crops_by_field: crops_by_field,
            activities_by_field: activities_by_field,
            harvests_by_field: harvests_by_field
          }
        }
      end

      private

      def set_field
        @field = current_user.fields.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Field not found" }, status: :not_found
      end

      def field_params
        params.require(:field).permit(
          :name, 
          :description, 
          :location,
          :area,
          coordinates: [[:lat, :lng]]
        )
      end

      def field_response(field)
        {
          id: field.id,
          name: field.name,
          description: field.description,
          location: field.location,
          area: field.area,
          coordinates: field.coordinates,
          crop_count: field.crop_animals.count,
          activity_count: field.farm_activities.is_a?(ActiveRecord::Relation) ? field.farm_activities.count : 0,
          harvest_count: field.harvests.count,
          created_at: field.created_at,
          updated_at: field.updated_at
        }
      end

      def activity_response(activity)
        {
          id: activity.id,
          activity_type: activity.activity_type,
          description: activity.description,
          start_date: activity.start_date,
          end_date: activity.end_date,
          status: activity.status,
          frequency: activity.frequency,
          crop: {
            id: activity.crop_animal&.id,
            name: activity.crop_animal&.name,
            crop_type: activity.crop_animal&.crop_type
          },
          coordinates: activity.coordinates,
          created_at: activity.created_at,
          updated_at: activity.updated_at
        }
      end

      def harvest_response(harvest)
        {
          id: harvest.id,
          quantity: harvest.quantity,
          harvest_date: harvest.harvest_date,
          crop: {
            id: harvest.crop_animal&.id,
            name: harvest.crop_animal&.name,
            crop_type: harvest.crop_animal&.crop_type
          },
          coordinates: harvest.coordinates,
          created_at: harvest.created_at,
          updated_at: harvest.updated_at
        }
      end

      def crop_response(crop)
        {
          id: crop.id,
          name: crop.name,
          crop_type: crop.crop_type,
          status: crop.status,
          planting_date: crop.planting_date,
          harvest_date: crop.harvest_date,
          expected_output: crop.expected_output,
          description: crop.description,
          created_at: crop.created_at,
          updated_at: crop.updated_at
        }
      end
    end
  end
end
