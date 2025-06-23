module Controllers::Api
  module V1
    module Farming
      class BaseController < Controllers::Api::BaseController
        before_action :authorize_farmer!

        private

        def authorize_farmer!
          unless current_user&.farmer?
            render json: { error: "Bạn không có quyền truy cập vào module Farming" }, status: :forbidden
          end
        end
      end
    end
  end
end
