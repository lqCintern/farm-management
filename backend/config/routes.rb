Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes with versioning
  namespace :api do
    namespace :v1 do
      resources :farm_activities, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :complete
        end

        collection do
          get :statistics
          get :history_by_field
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

      # Routes cho nhà cung cấp
      namespace :supplier do
        resources :supply_listings do
          member do
            put :change_status
          end
        end
        
        resources :supply_orders, only: [:index, :show, :update]
        get 'dashboard', to: 'supply_orders#dashboard'
      end
      
      # Routes cho nông dân
      resources :supply_listings, only: [:index, :show] do
        collection do
          get :categories
        end
      end
      
      resources :supply_orders, only: [:index, :show, :create] do
        member do
          patch :cancel
          patch :complete
        end
      end
      
    # Routes cho templates
    resources :pineapple_activity_templates do
      collection do
        post :apply_to_crop
      end
    end
    
    # Routes cho crop
    resources :pineapple_crops do
      member do
        post :generate_plan
        post :generate_stage_plan
        post :advance_stage
        post :record_harvest
        post :clean_activities
        
        post :confirm_plan
      end
      collection do
        get :statistics
        post :preview_plan
      end
    end

      resources :supplier_reviews, only: [:create]
      get 'suppliers/:id/reviews', to: 'supplier_reviews#supplier_reviews'

      post "/register", to: "auth#register"
      post "/login", to: "auth#login"
      post "auth/forgot_password", to: "auth#forgot_password"
      post "auth/reset_password", to: "auth#reset_password"
      get "/auth/profile", to: "auth#profile"
    end
  end
end
