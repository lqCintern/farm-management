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
      user = User.find_by(email: params[:email])
      if user
        user.reset_password_token = SecureRandom.hex(10)
        user.reset_password_sent_at = Time.now.utc
        user.save

        UserMailer.reset_password_email(user).deliver_now
        render json: { message: "Reset password instructions sent to your email" }, status: :ok
      else
        render json: { error: "Email not found" }, status: :not_found
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

    private

    # Mã hóa JWT
    def encode_token(payload)
      JWT.encode(payload, SECRET_KEY)
    end

    # Strong parameters
    def user_params
      params.permit(:user_name, :email, :password, :phone, :user_type, :fullname, :address)
    end
end
