module Api
  class BaseController < ApplicationController
    include HandleRecordNotFound
    before_action :authenticate_user!

    private

    def authenticate_user!
      render json: { error: 'Unauthorized' }, status: :unauthorized unless current_user
    end
  end
end
