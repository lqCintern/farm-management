module Controllers::Api
  module V1
    module SupplyChain
      class SupplierReviewsController < BaseController
        before_action :authenticate_user!, except: [ :supplier_reviews ]

        # POST /api/v1/supply_chain/supplier_reviews
        def create
          result = Services::CleanArch.create_supplier_review.execute(
            current_user.user_id,
            review_params
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message],
              data: result[:data]
            }, status: :created
          else
            render json: {
              status: "error",
              message: "Không thể đánh giá",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/supply_chain/suppliers/:id/reviews
        def supplier_reviews
          # Get supplier reviews
          reviews_result = Services::CleanArch.list_supplier_reviews.execute(
            params[:id],
            params[:page] || 1,
            params[:per_page] || 10
          )

          # Get supplier rating stats
          stats_result = Services::CleanArch.get_supplier_rating_stats.execute(params[:id])

          if reviews_result[:success] && stats_result[:success]
            render json: {
              status: "success",
              data: {
                supplier: stats_result[:data][:supplier],
                rating_stats: stats_result[:data][:stats][:rating_distribution],
                average_rating: stats_result[:data][:stats][:average_rating],
                reviews: reviews_result[:data],
                pagination: reviews_result[:pagination]
              }
            }
          else
            errors = (reviews_result[:errors] || []) + (stats_result[:errors] || [])

            render json: {
              status: "error",
              message: errors.join(", ")
            }, status: :unprocessable_entity
          end
        end

        private

        def review_params
          params.require(:review).permit(:supply_order_id, :rating, :content)
        end
      end
    end
  end
end
