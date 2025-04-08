require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])
    require Rails.root.join("app", "middleware", "authenticate_user")
    config.api_only = true

    # Cấu hình CORS để cho phép frontend truy cập API
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins "http://localhost:5173" # Chỉ cho phép frontend truy cập
        resource "*",
        headers: :any,
        methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
        credentials: true
      end
    end

    config.middleware.use AuthenticateUser
  end
end
