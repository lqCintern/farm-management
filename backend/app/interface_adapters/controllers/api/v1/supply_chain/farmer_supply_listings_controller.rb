module Controllers::Api
  module V1
    module SupplyChain
      class FarmerSupplyListingsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!, except: [ :index, :show, :categories ]

        # GET /api/v1/supply_listings
        def index
          filters = {
            category: params[:category],
            province: params[:province],
            district: params[:district],
            min_price: params[:min_price],
            max_price: params[:max_price],
            name: params[:name]
          }

          result = Services::CleanArch.supply_list_listings.execute(
            filters,
            params.fetch(:page, 1).to_i,
            params.fetch(:per_page, 15).to_i
          )

          if result[:success]
            render json: {
              status: "success",
              total_pages: result[:data][:pagination].total_pages,
              current_page: result[:data][:pagination].current_page,
              total_count: result[:data][:pagination].total_count,
              data: result[:data][:listings]
            }
          else
            render json: {
              status: "error",
              message: result[:errors].join(", ")
            }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/supply_listings/:id
        def show
          result = Services::CleanArch.supply_get_listing_details.execute(params[:id])

          if result[:success]
            render json: {
              status: "success",
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: result[:errors].join(", ")
            }, status: :not_found
          end
        end

        # GET /api/v1/supply_listings/categories
        def categories
          result = Services::CleanArch.supply_get_categories.execute

          if result[:success]
            render json: {
              status: "success",
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: result[:errors].join(", ")
            }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
