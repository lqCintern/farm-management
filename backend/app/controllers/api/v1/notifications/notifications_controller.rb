# app/controllers/api/v1/notifications/notifications_controller.rb
module Api
  module V1
    module Notifications
      class NotificationsController < Api::BaseController
        include PaginationHelper  # Thêm module này để sử dụng pagy
        before_action :set_notification, only: [ :show, :mark_as_read, :mark_as_unread, :destroy ]

        def index
          # Bắt đầu với scope cơ bản
          scope = current_user.notifications.order(created_at: :desc)

          # Optional category filter
          scope = scope.by_category(params[:category]) if params[:category].present?

          # Optional read/unread filter
          if params[:status] == "read"
            scope = scope.read
          elsif params[:status] == "unread"
            scope = scope.unread
          end

          # Sử dụng pagy thay vì kaminari
          @pagy, @notifications = pagy(scope, items: params[:per_page] || 20)

          render json: {
            notifications: @notifications.map(&:display_data),
            pagination: pagy_metadata(@pagy)
          }
        end

        def show
          render json: @notification.display_data
        end

        def mark_as_read
          @notification.mark_as_read!
          render json: {
            success: true,
            notification: @notification.display_data
          }
        end

        def mark_as_unread
          @notification.mark_as_unread!
          render json: {
            success: true,
            notification: @notification.display_data
          }
        end

        def mark_all_as_read
          scope = current_user.notifications.unread
          scope = scope.by_category(params[:category]) if params[:category].present?

          count = scope.count
          scope.update_all(read_at: Time.current)

          render json: { success: true, count: count }
        end

        def unread_count
          # Get counts by category
          counts = {
            total: current_user.notifications.unread.count,
            farm: current_user.notifications.unread.by_category("farm").count,
            labor: current_user.notifications.unread.by_category("labor").count,
            marketplace: current_user.notifications.unread.by_category("marketplace").count,
            supply: current_user.notifications.unread.by_category("supply").count
          }

          render json: { counts: counts }
        end

        def destroy
          @notification.destroy
          render json: { success: true }
        end

        private

        def set_notification
          @notification = current_user.notifications.find(params[:id])
        end
      end
    end
  end
end
