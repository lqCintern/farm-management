class Api::V1::FarmActivitiesController < Api::BaseController
  include PaginationHelper

  # Lấy danh sách tất cả nhật ký sản xuất
  def index
    @pagy, farm_activities = pagy(current_user.farm_activities, items: 10)
    render json: {
      farm_activities: FarmActivitySerializer.new(farm_activities).serializable_hash,
      pagination: pagy_metadata(@pagy)
    }, status: :ok
  end

  # Lấy thông tin chi tiết của một nhật ký sản xuất
  def show
    render json: FarmActivitySerializer.new(@farm_activity).serializable_hash, status: :ok
  end

  # Thêm mới nhật ký sản xuất
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

  # Cập nhật nhật ký sản xuất
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

  # Xóa nhật ký sản xuất
  def destroy
    @farm_activity.destroy
    render json: { message: "Farm activity deleted successfully" }, status: :ok
  end

  private

  # Strong parameters
  def farm_activity_params
    params.require(:farm_activity).permit(:activity_type, :description, :frequency, :status, :start_date, :end_date, :crop_animal_id)
  end
end
