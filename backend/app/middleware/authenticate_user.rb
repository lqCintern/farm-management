class AuthenticateUser
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    # Danh sách các đường dẫn không cần xác thực - cập nhật để khớp với routes
    public_paths = [
      "/api/v1/users/login",
      "/api/v1/users/register",
      "/api/v1/users/auth/forgot_password",
      "/api/v1/users/auth/reset_password"
    ]

    # Logging để debug
    Rails.logger.info "Current path: #{request.path}"

    # Bỏ qua xác thực cho Active Storage và public paths
    if request.path.start_with?("/rails/active_storage") || public_paths.include?(request.path)
      Rails.logger.info "Skipping authentication for public path: #{request.path}"
      return @app.call(env)
    end

    auth_header = request.get_header("HTTP_AUTHORIZATION")
    Rails.logger.info "Authorization Header: #{auth_header}"

    token = auth_header.split(" ").last if auth_header
    Rails.logger.info "Token: #{token}"

    if token
      begin
        decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: "HS256")[0]
        env["current_user"] = User.find_by(user_id: decoded_token["user_id"])
        Rails.logger.info "Decoded Token: #{decoded_token}"
        Rails.logger.info "Current User: #{env['current_user']&.email}"
      rescue JWT::ExpiredSignature
        Rails.logger.error "Token has expired"
        return unauthorized_response("Token has expired")
      rescue JWT::DecodeError
        Rails.logger.error "Invalid token"
        return unauthorized_response("Invalid token")
      rescue => e
        Rails.logger.error "Error during token verification: #{e.message}"
        return unauthorized_response("Authentication error")
      end
    else
      Rails.logger.error "No token provided"
      return unauthorized_response("No token provided")
    end

    @app.call(env)
  end

  private

  def unauthorized_response(message = "Unauthorized")
    [ 401, { "Content-Type" => "application/json" }, [ { error: message }.to_json ] ]
  end
end
