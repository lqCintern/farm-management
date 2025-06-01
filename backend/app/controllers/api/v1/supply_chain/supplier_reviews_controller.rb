module Api
  module V1
    module SupplyChain
      class SupplierReviewsController < BaseController
        before_action :authenticate_user!
        before_action :set_supply_order, only: [ :create ]

        # POST /api/v1/supply_chain/supplier_reviews
        def create
          # Kiểm tra xem đơn hàng đã hoàn thành chưa
          unless @supply_order.completed?
            render json: {
              status: "error",
              message: "Chỉ có thể đánh giá đơn hàng đã hoàn thành"
            }, status: :unprocessable_entity
            return
          end

          # Kiểm tra xem đã đánh giá chưa
          if SupplierReview.exists?(supply_order_id: @supply_order.id, reviewer_id: current_user.user_id)
            render json: {
              status: "error",
              message: "Bạn đã đánh giá đơn hàng này rồi"
            }, status: :unprocessable_entity
            return
          end

          @review = SupplierReview.new(review_params)
          @review.supply_order_id = @supply_order.id
          @review.supply_listing_id = @supply_order.supply_listing_id
          @review.reviewer_id = current_user.user_id
          @review.supplier_id = @supply_order.supply_listing.user.user_id

          if @review.save
            render json: {
              status: "success",
              message: "Đánh giá thành công",
              data: {
                id: @review.id,
                rating: @review.rating,
                content: @review.content,
                created_at: @review.created_at
              }
            }, status: :created
          else
            render json: {
              status: "error",
              message: "Không thể đánh giá",
              errors: @review.errors
            }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/supply_chain/suppliers/:id/reviews
        def supplier_reviews
          @supplier = User.find(params[:id])

          # Lấy danh sách đánh giá của nhà cung cấp này
          @reviews = SupplierReview.where(supplier_id: @supplier.user_id)
                                  .includes(:reviewer, :supply_listing)
                                  .order(created_at: :desc)
                                  .page(params[:page] || 1)
                                  .per(params[:per_page] || 10)

          # Tính toán thống kê đánh giá
          rating_stats = @supplier.supplier_reviews_received.group(:rating).count
          average_rating = @supplier.average_rating

          render json: {
            status: "success",
            data: {
              supplier: {
                id: @supplier.user_id,
                name: @supplier.user_name,
                average_rating: average_rating
              },
              rating_stats: rating_stats,
              reviews: @reviews.map { |review| review_json(review) },
              pagination: {
                total_pages: @reviews.total_pages,
                current_page: @reviews.current_page,
                total_count: @reviews.total_count
              }
            }
          }
        end

        private

        def set_supply_order
          @supply_order = current_user.supply_orders.find(params[:supply_order_id])
        rescue ActiveRecord::RecordNotFound
          render json: {
            status: "error",
            message: "Không tìm thấy đơn hàng"
          }, status: :not_found
        end

        def review_params
          params.require(:review).permit(:rating, :content)
        end

        def review_json(review)
          {
            id: review.id,
            rating: review.rating,
            content: review.content,
            created_at: review.created_at,
            reviewer: {
              id: review.reviewer.user_id,
              name: review.reviewer.user_name
            },
            supply_listing: {
              id: review.supply_listing.id,
              name: review.supply_listing.name
            }
          }
        end
      end
    end
  end
end
