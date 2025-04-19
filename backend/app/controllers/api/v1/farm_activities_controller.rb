class Api::V1::FarmActivitiesController < Api::BaseController
  include PaginationHelper

  before_action :set_farm_activity, only: [ :show, :update, :destroy ]

  def index
    activities = current_user.farm_activities

    begin
      activities = FarmActivityFilterService.new(
        activities,
        params[:start_date],
        params[:end_date]
      ).filter
    rescue ArgumentError => e
      return render json: { error: e.message }, status: :unprocessable_entity
    end

    @pagy, activities = pagy(activities, items: 10)

    activities_with_status = activities.map do |activity|
      decorated_activity = FarmActivityDecorator.new(activity)
      {
        id: activity.id,
        activity_type: activity.activity_type,
        description: activity.description,
        start_date: decorated_activity.formatted_start_date,
        end_date: decorated_activity.formatted_end_date,
        status_label: decorated_activity.status_label,
        status_details: FarmActivityStatusService.new(activity).status_details
      }
    end

    render json: {
      farm_activities: activities_with_status,
      pagination: pagy_metadata(@pagy)
    }, status: :ok
  end

  def show
    render json: FarmActivitySerializer.new(@farm_activity).serializable_hash, status: :ok
  end

  def create
    farm_activity = current_user.farm_activities.new(farm_activity_params)
    if farm_activity.save
      render json: {
        message: "Farm activity created successfully",
        data: FarmActivitySerializer.new(farm_activity).serializable_hash
      }, status: :created
    else
      render json: { errors: farm_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @farm_activity.update(farm_activity_params)
      render json: {
        message: "Farm activity updated successfully",
        data: FarmActivitySerializer.new(@farm_activity).serializable_hash
      }, status: :ok
    else
      render json: { errors: @farm_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @farm_activity.destroy
    render json: { message: "Farm activity deleted successfully" }, status: :ok
  end

  private

  def set_farm_activity
    @farm_activity = current_user.farm_activities.find_by(id: params[:id])
    render json: { error: "Farm activity not found" }, status: :not_found unless @farm_activity
  end

  def farm_activity_params
    params.require(:farm_activity).permit(:activity_type, :description, :frequency, :status, :start_date, :end_date, :crop_animal_id)
  end
end
