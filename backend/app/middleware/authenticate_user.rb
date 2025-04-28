class AuthenticateUser
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    
    # Bỏ qua xác thực cho Active Storage requests
    if request.path.start_with?("/rails/active_storage")
      return @app.call(env)
    end
    
    auth_header = request.get_header("HTTP_AUTHORIZATION")
    token = auth_header.split(" ").last if auth_header

    Rails.logger.info "Authorization Header: #{auth_header}"
    Rails.logger.info "Token: #{token}"

    if token
      begin
        decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: "HS256")[0]
        env["current_user"] = User.find_by(user_id: decoded_token["user_id"])
        Rails.logger.info "Decoded Token: #{decoded_token}"
        Rails.logger.info "Current User: #{env['current_user'].inspect}"
      rescue JWT::ExpiredSignature
        Rails.logger.error "Token has expired"
        return unauthorized_response("Token has expired")
      rescue JWT::DecodeError
        Rails.logger.error "Invalid token"
        return unauthorized_response("Invalid token")
      end
    else
      Rails.logger.error "No token provided"
      return unauthorized_response
    end

    @app.call(env)
  end

  private

  def unauthorized_response(message = "Unauthorized")
    [ 401, { "Content-Type" => "application/json" }, [ { error: message }.to_json ] ]
  end
end
