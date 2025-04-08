class ApplicationController < ActionController::API
  include Pagy::Backend

  rescue_from ActiveRecord::RecordNotFound do |exception|
    render json: { error: exception.message }, status: :not_found
  end

  rescue_from CanCan::AccessDenied do |exception|
    render json: { error: exception.message }, status: :forbidden
  end

  private

  # Truy cập người dùng hiện tại từ middleware
  def current_user
    Rails.logger.info "Current User: #{request.env['current_user'].inspect}"
    request.env["current_user"]
  end

  # Xác thực người dùng
  def authenticate_user!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end
end
