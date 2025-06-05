# app/controllers/api/v1/notifications/settings_controller.rb
module Api
  module V1
    module Notifications
      class SettingsController < Api::BaseController
        before_action :set_notification_setting, only: [ :update ]

        def index
          @settings = current_user.notification_settings

          render json: @settings
        end

        def create
          @setting = current_user.notification_settings.new(notification_setting_params)

          if @setting.save
            render json: @setting, status: :created
          else
            render json: { errors: @setting.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @setting.update(notification_setting_params)
            render json: @setting
          else
            render json: { errors: @setting.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def reset_to_default
          current_user.notification_settings.destroy_all
          current_user.create_default_notification_settings

          render json: { success: true, settings: current_user.notification_settings }
        end

        private

        def set_notification_setting
          @setting = current_user.notification_settings.find(params[:id])
        end

        def notification_setting_params
          params.require(:notification_setting).permit(
            :category, :event_type, :email_enabled, :push_enabled, :in_app_enabled
          )
        end
      end
    end
  end
end
