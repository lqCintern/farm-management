Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes with versioning
  namespace :api do
    namespace :v1 do
      resources :farm_activities
      resources :farm_materials
      post "/register", to: "auth#register"
      post "/login", to: "auth#login"
      post "auth/forgot_password", to: "auth#forgot_password"
      post "auth/reset_password", to: "auth#reset_password"
    end
  end
end
