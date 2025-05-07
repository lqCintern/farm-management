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

      resources :product_listings do
        collection do
          get :my_listings
        end
        member do
          put :toggle_status
        end
      end
      resources :fields do
        member do
          get :activities
          get :harvests
          get :crops
        end
        collection do
          get :stats
        end
      end
      resources :crop_animals
      resources :product_orders, only: [:index, :show, :create, :update]
      
      resources :conversations, only: [:index, :show, :create] do
        member do
          get :messages
          post :messages, to: 'conversations#add_message'
        end
      end

      resources :farm_materials
            resources :harvests do
        collection do
          get :by_crop # GET /api/v1/harvests/by_crop/:crop_id
          get :by_field # GET /api/v1/harvests/by_field/:field_id
          get :stats # GET /api/v1/harvests/stats
        end
      end
      
      post "/register", to: "auth#register"
      post "/login", to: "auth#login"
      post "auth/forgot_password", to: "auth#forgot_password"
      post "auth/reset_password", to: "auth#reset_password"
    end
  end
end
