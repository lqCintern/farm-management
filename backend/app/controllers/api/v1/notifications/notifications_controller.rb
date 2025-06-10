# app/controllers/api/v1/notifications/notifications_controller.rb
module Api
  module V1
    module Notifications
      class NotificationsController < Api::BaseController
        before_action :authenticate_user!

        def index
          result = CleanArch.notification_list.execute(
            user_id: current_user.user_id,
            category: params[:category],
            status: params[:status],
            page: params[:page] || 1,
            per_page: params[:per_page] || 20
          )

          render json: {
            notifications: result[:notifications].map(&:display_data),
            pagination: {
              count: result[:pagy].count,
              page: result[:pagy].page,
              pages: result[:pagy].pages,
              last: result[:pagy].last,
              next: result[:pagy].next,
              prev: result[:pagy].prev
            }
          }
        end

        def show
          result = CleanArch.notification_get_details.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: result[:notification].display_data
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        def mark_as_read
          result = CleanArch.notification_mark_as_read.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: {
              success: true,
              notification: result[:notification].display_data
            }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        def mark_as_unread
          result = CleanArch.notification_mark_as_unread.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: {
              success: true,
              notification: result[:notification].display_data
            }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        def mark_all_as_read
          result = CleanArch.notification_mark_all_as_read.execute(
            current_user.user_id,
            params[:category]
          )

          render json: { success: true, count: result[:count] }
        end

        def unread_count
          result = CleanArch.notification_get_unread_count.execute(current_user.user_id)

          render json: { counts: result[:counts] }
        end

        def destroy
          result = CleanArch.notification_delete.execute(params[:id], current_user.user_id)

          if result[:success]
            render json: { success: true }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
