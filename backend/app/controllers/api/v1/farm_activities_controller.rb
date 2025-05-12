class Api::V1::FarmActivitiesController < Api::BaseController
  include PaginationHelper

  before_action :set_farm_activity, only: [:show, :update, :destroy, :complete]

  def index
    activities = current_user.farm_activities

    activities = FarmActivityFilterService.new(
      activities,
      params[:start_date],
      params[:end_date],
      params[:activity_type],
      params[:crop_animal_id],
      params[:status]
    ).filter

    @pagy, activities = pagy(activities, items: 10)

    # Sử dụng renderer service để trả về dữ liệu phẳng hơn
    render json: ApiRendererService.render_farm_activities(activities, @pagy), status: :ok
  end

  def show
    options = { include: [:activity_materials] }
    
    # Chỉ một farm activity, nhưng vẫn sử dụng renderer để xử lý nhất quán
    render json: {
      data: ApiRendererService.render_farm_activities([@farm_activity], nil, options)[:farm_activities].first
    }, status: :ok
  end

  def create
    service = FarmActivityService.new(current_user.farm_activities.new, current_user)
    farm_activity = service.create_activity(farm_activity_params)

    if farm_activity.errors.empty?
      render json: {
        message: "Lịch chăm sóc đã được tạo thành công",
        data: ApiRendererService.render_farm_activities([farm_activity], nil)[:farm_activities].first
      }, status: :created
    else
      render json: { errors: farm_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    # Chỉ cho phép cập nhật nếu hoạt động chưa hoàn thành
    if @farm_activity.completed?
      return render json: { error: "Không thể chỉnh sửa hoạt động đã hoàn thành" }, status: :unprocessable_entity
    end

    service = FarmActivityService.new(@farm_activity, current_user)
    farm_activity = service.update_activity(farm_activity_params)

    if farm_activity.errors.empty?
      render json: {
        message: "Lịch chăm sóc đã được cập nhật thành công",
        data: ApiRendererService.render_farm_activities([farm_activity], nil)[:farm_activities].first
      }, status: :ok
    else
      render json: { errors: farm_activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # Chỉ cho phép xóa nếu hoạt động chưa hoàn thành
    if @farm_activity.completed?
      return render json: { error: "Không thể xóa hoạt động đã hoàn thành" }, status: :unprocessable_entity
    end

    service = FarmActivityService.new(@farm_activity, current_user)
    service.destroy_activity

    render json: { message: "Đã hủy lịch chăm sóc thành công" }, status: :ok
  end

  # API để đánh dấu hoàn thành và cập nhật thông tin thực tế
  def complete
    # Validate và tìm activity
    @farm_activity = current_user.farm_activities.find(params[:id])
  
    # Gọi service để xử lý hoàn thành
    service = FarmActivityService.new(@farm_activity, current_user)
    result = service.complete_activity(completion_params)
  
    # Kiểm tra kết quả từ service
    if result[:success]
      render json: {
        message: "Đã đánh dấu hoàn thành hoạt động",
        data: ApiRendererService.render_farm_activities([@farm_activity], nil)[:farm_activities].first,
        suggestion: result[:suggestion]
      }, status: :ok
    else
      render json: { error: result[:error] }, status: :unprocessable_entity
    end
  end

  # API thống kê
  def statistics
    # Chuyển đổi các tham số thành kiểu dữ liệu phù hợp
    year = params[:year].present? ? params[:year].to_i : Date.today.year
    month = params[:month].present? ? params[:month].to_i : Date.today.month
    quarter = params[:quarter].present? ? params[:quarter].to_i : ((Date.today.month - 1) / 3 + 1)
    period = %w[month quarter year].include?(params[:period]) ? params[:period] : 'month'
    
    stats_service = FarmActivityStatsService.new(
      current_user.farm_activities,
      period,
      year,
      month,
      quarter
    )
    
    stats = stats_service.generate_stats
    
    render json: { statistics: stats }, status: :ok
  end

  # API lịch sử theo cánh đồng
  def history_by_field
    activities = current_user.farm_activities
      .where(crop_animal_id: params[:crop_animal_id])
      .order(start_date: :desc)

    @pagy, activities = pagy(activities, items: 10)

    render json: {
      history: ApiRendererService.render_farm_activities(activities, @pagy)[:farm_activities],
      pagination: pagy_metadata(@pagy)
    }, status: :ok
  end

  # API để lấy danh sách hoạt động theo giai đoạn
  def stage_activities
    crop = PineappleCrop.find(params[:pineapple_crop_id])
  
    # Gọi service để xử lý logic
    result = FarmActivityService.new(nil, current_user)
              .get_stage_activities(crop, params[:current_stage_only])
              
    @pagy, activities = pagy(result, items: 10)
  
    render json: {
      data: ApiRendererService.render_farm_activities(activities, @pagy),
      stage: crop.current_stage,
      pagination: pagy_metadata(@pagy)
    }, status: :ok
  end

  private

  def set_farm_activity
    @farm_activity = current_user.farm_activities.find_by(id: params[:id])
    render json: { error: "Không tìm thấy lịch chăm sóc" }, status: :not_found unless @farm_activity
  end

  def farm_activity_params
    params.require(:farm_activity).permit(
      :activity_type, 
      :description, 
      :frequency, 
      :status, 
      :start_date, 
      :end_date, 
      :crop_animal_id,
      :field_id,
      materials: {}
    )
  end

  def completion_params
    params.require(:farm_activity).permit(
      :actual_notes,
      actual_materials: {}
    )
  end
end
