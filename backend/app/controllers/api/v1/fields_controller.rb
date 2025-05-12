module Api
  module V1
    class FieldsController < Api::BaseController
      before_action :set_field, only: [:show, :update, :destroy, :activities, :harvests, :pineapple_crops]

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
          @field.area = field_params[:area] || @field.calculate_area
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
        if @field.pineapple_crops.exists? || @field.farm_activities.exists? || @field.harvests.exists?
          render json: { 
            error: "Cannot delete field. It has associated pineapple crops, activities or harvests." 
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
                          .includes(:pineapple_crop, :user)
                          .order(start_date: :desc)
        
        render json: {
          message: "Field activities retrieved successfully",
          data: activities.map { |a| activity_response(a) }
        }
      end

      # GET /api/v1/fields/:id/harvests
      def harvests
        harvests = @field.harvests
                        .includes(:pineapple_crop, :user)
                        .order(harvest_date: :desc)
        
        render json: {
          message: "Field harvests retrieved successfully",
          data: harvests.map { |h| harvest_response(h) }
        }
      end

      # GET /api/v1/fields/:id/pineapple_crops
      def pineapple_crops
        pineapple_crops = @field.pineapple_crops

        render json: {
          message: "Field pineapple crops retrieved successfully",
          data: pineapple_crops.map { |c| pineapple_crop_response(c) }
        }
      end

      # GET /api/v1/fields/stats
      def stats
        # Thống kê theo diện tích
        total_area = current_user.fields.sum(:area)
        
        # Thống kê theo vụ trồng dứa
        crops_by_field = current_user.fields
                                    .joins(:pineapple_crops)
                                    .group("fields.id")
                                    .count("pineapple_crops.id")
        
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
          pineapple_crop: activity.pineapple_crop ? {
            id: activity.pineapple_crop.id,
            name: activity.pineapple_crop.name,
            current_stage: activity.pineapple_crop.current_stage
          } : nil,
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
          pineapple_crop: harvest.pineapple_crop ? {
            id: harvest.pineapple_crop.id,
            name: harvest.pineapple_crop.name,
            current_stage: harvest.pineapple_crop.current_stage
          } : nil,
          coordinates: harvest.coordinates,
          created_at: harvest.created_at,
          updated_at: harvest.updated_at
        }
      end

      def pineapple_crop_response(crop)
        {
          id: crop.id,
          name: crop.name,
          season_type: crop.season_type,
          current_stage: crop.current_stage,
          status: crop.status,
          planting_date: crop.planting_date,
          field_area: crop.field_area,
          planting_density: crop.planting_density,
          variety: crop.variety,
          source: crop.source,
          description: crop.description,
          created_at: crop.created_at,
          updated_at: crop.updated_at
        }
      end
    end
  end
end