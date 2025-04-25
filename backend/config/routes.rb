Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes with versioning
  namespace :api do
    namespace :v1 do
      resources :farm_activities, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :complete # API để đánh dấu hoàn thành
        end

        collection do
          get :statistics # API thống kê
          get :history_by_field # API lịch sử theo cánh đồng
        end
      end

      resources :farm_materials
      resources :harvests, only: [:create]
      post "/register", to: "auth#register"
      post "/login", to: "auth#login"
      post "auth/forgot_password", to: "auth#forgot_password"
      post "auth/reset_password", to: "auth#reset_password"
    end
  end
end
