class FarmActivitiesController < ApplicationController
  load_and_authorize_resource

  # Lấy danh sách tất cả nhật ký sản xuất
  def index
    farm_activities = current_user.farm_activities.page(params[:page]).per(10)
    render json: farm_activities, status: :ok
  end

  # Lấy thông tin chi tiết của một nhật ký sản xuất
  def show
    render json: @farm_activity, status: :ok
  end

  # Thêm mới nhật ký sản xuất
  def create
    Rails.logger.info "Current User: #{current_user.inspect}"
    Rails.logger.info "User Type: #{current_user&.user_type}"

    farm_activity = current_user.farm_activities.new(farm_activity_params)
    if farm_activity.save
      render json: { message: "Farm activity created successfully", data: farm_activity }, status: :created
    else
      render json: { errors: farm_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # Cập nhật nhật ký sản xuất
  def update
    if @farm_activity.update(farm_activity_params)
      render json: { message: "Farm activity updated successfully", data: @farm_activity }, status: :ok
    else
      render json: { errors: @farm_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # Xóa nhật ký sản xuất
  def destroy
    @farm_activity.destroy
    render json: { message: "Farm activity deleted successfully" }, status: :ok
  end

  private

  # Tìm nhật ký sản xuất theo ID
  def set_farm_activity
    @farm_activity = current_user.farm_activities.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Farm activity not found" }, status: :not_found
  end

  # Strong parameters
  def farm_activity_params
    params.require(:farm_activity).permit(:activity_type, :description, :frequency, :status, :start_date, :end_date, :crop_animal_id)
  end
end
