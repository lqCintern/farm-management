Rails.application.routes.draw do
  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes with versioning
  namespace :controllers do
    namespace :api do
      namespace :v1 do
        # Module Farming
        namespace :farming do
          resources :farm_activities, only: [ :index, :show, :create, :update, :destroy ] do
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

          resources :farm_materials do
            collection do
              get :statistics  # Thêm route mới cho thống kê vật tư
            end
          end
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
            
            resources :template_activity_materials, path: "materials", only: [:index, :show, :create, :update, :destroy] do
              collection do
                post :batch_create
                get :statistics
                get :feasibility
                get :inventory_comparison
              end
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
              get :activities
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

          resources :product_orders, only: [ :index, :show, :create, :update ]

          resources :conversations do
            collection do
              get :available_users
            end
            member do
              get :messages
              post :messages, to: "conversations#add_message"
            end
          end

          resources :marketplace_harvests, path: "harvests" do
            collection do
              get :active_by_product
              get :my_harvests
              get :by_product
            end

            member do
              post :payment_proof, to: "marketplace_harvests#upload_payment_proof"
            end
          end

          resources :users, only: [] do
            member do
              get :verify, to: "user_verification#verify"
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

          resources :supply_orders, only: [ :index, :show, :update ] do
            member do
              patch :cancel
              patch :complete
            end
          end

          get "dashboard", to: "supply_orders#dashboard"

          # Routes cho nông dân
          resources :farmer_supply_listings, only: [ :index, :show ] do
            collection do
              get :categories # Bổ sung route cho categories
            end
          end

          resources :farmer_supply_orders, only: [ :index, :show, :create ] do
            member do
              patch :cancel
              patch :complete
            end
          end

          resources :supplier_reviews, only: [ :create ]
          get "suppliers/:id/reviews", to: "supplier_reviews#supplier_reviews"
        end

        # Module Labor
        namespace :labor do
          # Đặt các custom routes trước resources
          get "labor_assignments/my_assignments", to: "labor_assignments#my_assignments"

          # Sau đó định nghĩa resources thông thường
          resources :labor_assignments do
            collection do
              get :my_assignments
              get :household_assignments  # Thêm route mới
              post :complete_multiple     # Thêm route mới
              get :check_conflicts
              get :stats
              get :worker_availability
            end

            member do
              post :report_completion  # Endpoint mới cho worker
              post :complete  # Chỉ dành cho farmer
              post :reject    # Dành cho worker
              post :missed    # Dành cho farmer
              post :rate_worker
              post :rate_farmer
            end
          end

          resources :farm_households do
            resources :household_workers, only: [ :index, :show, :create, :destroy ] do
              member do
                patch :update_status
              end
            end
            collection do
              get :current, to: "farm_households#current"
            end
          end

          resources :worker_profiles do
            collection do
              get :my_profile
              get :available_workers
            end
          end

          resources :labor_requests do
            resources :labor_assignments, shallow: true

            member do
              post :accept
              post :decline
              post :complete
              post :cancel
              post :join
              get :group_status
              get :suggest_workers
            end

            collection do
              post :batch_assign
              post :create_mixed
              get :public_requests
              get :for_activity
            end
          end

          resources :labor_exchanges, path: "exchanges" do
            collection do
              post "initialize", to: "labor_exchanges#initialize_exchanges"
              post "households/:household_id/recalculate", to: "labor_exchanges#recalculate", as: :recalculate
              post "recalculate_all", to: "labor_exchanges#recalculate_all", as: :recalculate_all
              post "adjust_balance", to: "labor_exchanges#adjust_balance"
              get "transaction_history", to: "labor_exchanges#transaction_history"
              get "households/:household_id", to: "labor_exchanges#show_by_household", as: :by_household
            end

            member do
              post "reset_balance"
            end
          end

          # Nested routes cho household workers
          resources :farm_households do
            resources :household_workers, only: [ :index, :show, :create, :destroy ] do
              member do
                patch :update_status
              end
            end
          end

          # Route để lấy workers của household hiện tại (cho frontend)
          get "household/workers", to: "household_workers#index"
        end

        # Module Users
        namespace :users do
          post "/register", to: "auth#register"
          post "/login", to: "auth#login"
          post "auth/forgot_password", to: "auth#forgot_password"
          post "auth/reset_password", to: "auth#reset_password"
          get "/auth/profile", to: "auth#profile"
        end

        # Module Notifications
        namespace :notifications do
          resources :notifications, only: [ :index, :show, :destroy ] do
            member do
              post :mark_as_read
              post :mark_as_unread
            end

            collection do
              post :mark_all_as_read
              get :unread_count
            end
          end

          resources :settings, only: [ :index, :create, :update ] do
            collection do
              post :reset_to_default
            end
          end
        end

        # Module Climate
        namespace :climate do
          get "weather/current", to: "weather#current"
          get "weather/forecast", to: "weather#forecast"
          get "weather/field/:id/forecast", to: "weather#field_forecast"

          resources :weather_settings, only: [ :show, :update ]
        end
      end
    end
  end
end
