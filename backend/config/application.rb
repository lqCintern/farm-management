require_relative "boot"

require "rails/all"
require "jsonapi/serializer"

Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.0

    config.autoload_lib(ignore: %w[assets tasks])

    # CLEAN ARCHITECTURE SETUP - ĐƠN GIẢN HÓA
    # ---------------------------
    # 1. Autoload paths - chỉ các thư mục gốc
    config.autoload_paths += %w[
      app/decorators
      app/domain
      app/formatters # Thêm formatters
      app/infrastructure
      app/interfaces
      app/presenters # Thêm presenters
      app/use_cases
    ].map { |path| "#{config.root}/#{path}" }

    # 2. Eager load trong development để giúp debug
    config.eager_load = true if Rails.env.development?

    require Rails.root.join("app", "middleware", "authenticate_user")
    config.api_only = true

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
