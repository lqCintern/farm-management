Rails.application.routes.draw do
  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes with versioning
  namespace :api do
    namespace :v1 do
      # Module Farming
      namespace :farming do
        resources :farm_activities, only: [:index, :show, :create, :update, :destroy] do
          member do
            post :complete
          end
          collection do
            get :statistics
            get :history_by_field
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

        resources :farm_materials
        resources :harvests do
          collection do
            get :by_crop
            get :by_field
            get :stats
          end
        end

        resources :pineapple_activity_templates do
          collection do
            post :apply_to_crop
          end
        end

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
      end

      # Module Marketplace
      namespace :marketplace do
        resources :product_listings do
          collection do
            get :my_listings
          end
          member do
            put :toggle_status
          end
        end

        resources :product_orders, only: [:index, :show, :create, :update]

        resources :conversations, only: [:index, :show, :create] do
          member do
            get :messages
            post :messages, to: 'conversations#add_message'
          end
        end
      end

      # Module SupplyChain
      namespace :supply_chain do
        # Routes cho nhà cung cấp
        resources :supply_listings do
          member do
            put :change_status
          end
        end

        resources :supply_orders, only: [:index, :show, :update] do
          member do
            patch :cancel
            patch :complete
          end
        end

        get 'dashboard', to: 'supply_orders#dashboard'

        # Routes cho nông dân
        resources :farmer_supply_listings, only: [:index, :show] do
          collection do
            get :categories
          end
        end

        resources :farmer_supply_orders, only: [:index, :show, :create] do
          member do
            patch :cancel
            patch :complete
          end
        end

        resources :supplier_reviews, only: [:create]
        get 'suppliers/:id/reviews', to: 'supplier_reviews#supplier_reviews'
      end

      # Module Users
      namespace :users do
        post "/register", to: "auth#register"
        post "/login", to: "auth#login"
        post "auth/forgot_password", to: "auth#forgot_password"
        post "auth/reset_password", to: "auth#reset_password"
        get "/auth/profile", to: "auth#profile"
      end
    end
  end
end
