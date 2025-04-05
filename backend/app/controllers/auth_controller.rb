class AuthController < ApplicationController
    require 'jwt'
  
    SECRET_KEY = Rails.application.credentials.secret_key_base
  
    # Đăng ký
    def register
      user = User.new(user_params)
      if user.save
        render json: { message: 'User created successfully' }, status: :created
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
        render json: { error: 'Invalid email or password' }, status: :unauthorized
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