module Api
  module V1
    module SupplyChain
      class BaseController < Api::BaseController
        before_action :authorize_supplier!

        private

        def authorize_supplier!
          unless current_user&.supplier? || current_user&.farmer?
            render json: { error: "Bạn không có quyền truy cập vào module SupplyChain" }, status: :forbidden
          end
        end
      end
    end
  end
end
