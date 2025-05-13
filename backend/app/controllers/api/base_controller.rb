module Api
  class BaseController < ApplicationController
    include HandleRecordNotFound
    before_action :authenticate_user!

    rescue_from CanCan::AccessDenied do |exception|
      render json: { error: "Bạn không có quyền truy cập" }, status: :forbidden
    end

    private

    def authenticate_user!
      render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
    end
  end
end