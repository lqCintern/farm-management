class FarmActivityService
  def initialize(farm_activity, user)
    @farm_activity = farm_activity
    @user = user
  end

  # Tạo mới hoạt động nông trại
  def create_activity(params)
    # Chuyển đổi status nếu là enum
    if FarmActivity.defined_enums["status"] && params[:status].present?
        params[:status] = params[:status].downcase # Chuyển thành chữ thường
    end

    @farm_activity.assign_attributes(params)
    @farm_activity.save
    @farm_activity
  end

  # Cập nhật hoạt động nông trại
  def update_activity(params)
    @farm_activity.assign_attributes(params)
    @farm_activity.save
    @farm_activity
  end

  # Xóa hoạt động nông trại
  def destroy_activity
    @farm_activity.destroy
  end

  # Đánh dấu hoàn thành hoạt động
  def complete_activity(params)
    @farm_activity.assign_attributes(params)
    @farm_activity.status = "Completed"
    @farm_activity.save
    @farm_activity
  end
end
