module Api
  module V1
    module Marketplace
      class BaseController < Api::BaseController
        before_action :authorize_marketplace_user!

        private

        def authorize_marketplace_user!
          unless current_user&.trader? || current_user&.farmer?
            render json: { error: "Bạn không có quyền truy cập vào module Marketplace" }, status: :forbidden
          end
        end
      end
    end
  end
end
