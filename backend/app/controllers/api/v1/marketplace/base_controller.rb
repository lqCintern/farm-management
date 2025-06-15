module Api
  module V1
    module Marketplace
      class BaseController < Api::BaseController
        before_action :set_current_user_in_thread
        before_action :authorize_marketplace_user!
        after_action :clear_thread_variables

        private

        def authorize_marketplace_user!
          unless current_user&.trader? || current_user&.farmer?
            render json: { error: "Bạn không có quyền truy cập vào module Marketplace" }, status: :forbidden
          end
        end

        # Thiết lập current_user vào Thread.current để có thể truy cập từ model
        def set_current_user_in_thread
          Thread.current[:current_user] = current_user if defined?(current_user) && current_user
        end
        
        # Xóa dữ liệu Thread.current sau khi request kết thúc để tránh memory leak
        def clear_thread_variables
          Thread.current[:current_user] = nil
        end
      end
    end
  end
end
