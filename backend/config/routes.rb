Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  post "/register", to: "auth#register"
  post "/login", to: "auth#login"
  post "auth/forgot_password", to: "auth#forgot_password"
  post "auth/reset_password", to: "auth#reset_password"
  resources :farm_activities
end
