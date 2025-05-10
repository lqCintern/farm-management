module Api
  module V1
    class AuthController < ApplicationController
      require "jwt"

      SECRET_KEY = Rails.application.credentials.secret_key_base

      # Đăng ký
      def register
        user = User.new(user_params)
        if user.save
          render json: { message: "User created successfully" }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # Đăng nhập
      def login
        user = User.find_by(email: params[:email])
        if user&.authenticate(params[:password])
          token = encode_token({ user_id: user.id })
          render json: { token: token }, status: :ok
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      # Quên mật khẩu
      def forgot_password
        Rails.logger.info "Processing forgot_password for email: #{params[:email]}"
        user = User.find_by(email: params[:email])
        if user
          if user.reset_password_token.nil? || user.reset_password_sent_at < 2.hours.ago
            user.reset_password_token = generate_unique_token
            user.reset_password_sent_at = Time.now.utc
            if user.save
              Rails.logger.info "Token saved successfully: #{user.reset_password_token}"
              UserMailer.reset_password_email(user).deliver_now
              render json: { message: "Reset password instructions sent to your email" }, status: :ok
            else
              Rails.logger.error "Failed to save token: #{user.errors.full_messages}"
              render json: { error: "Failed to generate reset password token" }, status: :unprocessable_entity
            end
          else
            Rails.logger.info "Token already exists and is still valid for user: #{user.email}"
            render json: { message: "Reset password instructions already sent. Please check your email." }, status: :ok
          end
        else
          Rails.logger.info "Email not found: #{params[:email]}"
          render json: { message: "If the email exists in our system, reset instructions have been sent." }, status: :ok
        end
      end

      # Đặt lại mật khẩu
      def reset_password
        user = User.find_by(reset_password_token: params[:token])
        if user && user.reset_password_sent_at > 2.hours.ago
          if user.update(password: params[:password])
            render json: { message: "Mật khẩu đã được đặt lại thành công." }, status: :ok
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        else
          render json: { error: "Token không hợp lệ hoặc đã hết hạn." }, status: :unauthorized
        end
      end

      # Lấy thông tin người dùng
      def profile
        token = request.headers["Authorization"]&.split(" ")&.last
        if token
          decoded_token = decode_token(token)
          user_id = decoded_token[0]["user_id"]
          user = User.find_by(user_id: user_id)

          if user
            render json: {
              id: user.user_id,
              email: user.email,
              user_name: user.user_name,
              user_type: user.user_type,
              fullname: user.fullname,
              phone: user.phone,
              address: user.address
            }, status: :ok
          else
            render json: { error: "User not found" }, status: :not_found
          end
        else
          render json: { error: "Token is missing" }, status: :unauthorized
        end
      end

      private

      # Mã hóa JWT
      def encode_token(payload)
        JWT.encode(payload, SECRET_KEY)
      end

      # Giải mã JWT
      def decode_token(token)
        JWT.decode(token, SECRET_KEY, true, algorithm: "HS256")
      rescue JWT::DecodeError
        nil
      end

      # Strong parameters
      def user_params
        params.permit(:user_name, :email, :password, :phone, :user_type, :fullname, :address)
      end

      def generate_unique_token
        loop do
          token = SecureRandom.hex(10)
          break token unless User.exists?(reset_password_token: token)
        end
      end
    end
  end
end
