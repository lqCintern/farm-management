module Controllers::Api
  module V1
    module Marketplace
      class UserVerificationController < BaseController
        before_action :authenticate_user!

        # GET /api/v1/marketplace/users/:id/verify
        def verify
          user = User.find_by(user_id: params[:id])

          if user.nil?
            return render json: { error: "Không tìm thấy người dùng" }, status: :not_found
          end

          # Thống kê giao dịch
          transaction_stats = if user.user_type == "trader"  # Sửa từ user.trader? thành user.user_type == "trader"
            {
              total_purchases: ProductOrder.where(buyer_id: user.user_id).count,
              completed_purchases: ProductOrder.where(buyer_id: user.user_id, status: "completed").count,
              total_purchase_value: ProductOrder.joins(:product_listing)
                                     .where(buyer_id: user.user_id, status: "completed")
                                     .sum("product_listings.price_expectation * product_orders.quantity")
            }
          else
            # Với vai trò nông dân/nhà cung cấp
            product_listings = ProductListing.where(user_id: user.user_id)
            orders = ProductOrder.where(product_listing_id: product_listings.pluck(:id))

            {
              total_listings: product_listings.count,
              active_listings: product_listings.where(status: "active").count,
              sold_listings: product_listings.where(status: "sold").count,
              total_sales: orders.where(status: "completed").count,
              total_sale_value: orders.joins(:product_listing)
                                .where(status: "completed")
                                .sum("product_listings.price_expectation * product_orders.quantity")
            }
          end

          # Thông tin tiêu chí uy tín
          reputation_criteria = {
            completed_transaction_rate: calculate_completion_rate(user),
            average_rating: calculate_average_rating(user),
            time_on_platform: (Date.today - user.created_at.to_date).to_i
          }

          # Điểm uy tín (1-5 sao)
          reputation_score = calculate_reputation_score(reputation_criteria)

          render json: {
            user: {
              user_id: user.user_id,
              fullname: user.fullname,
              phone: user.phone,
              role: user.user_type,  # Sửa từ user.role thành user.user_type
              joined_date: user.created_at.strftime("%d/%m/%Y"),
              address: user.address
            },
            transaction_stats: transaction_stats,
            reputation: {
              score: reputation_score,
              criteria: reputation_criteria
            }
          }
        end

        private

        def calculate_completion_rate(user)
          if user.user_type == "trader"  # Sửa từ user.trader? thành user.user_type == "trader"
            total_orders = ProductOrder.where(buyer_id: user.user_id).where.not(status: "pending").count
            completed_orders = ProductOrder.where(buyer_id: user.user_id, status: "completed").count
          else
            product_listings = ProductListing.where(user_id: user.user_id)
            total_orders = ProductOrder.where(product_listing_id: product_listings.pluck(:id)).where.not(status: "pending").count
            completed_orders = ProductOrder.where(product_listing_id: product_listings.pluck(:id), status: "completed").count
          end

          return 0 if total_orders == 0
          (completed_orders.to_f / total_orders * 100).round
        end

        def calculate_average_rating(user)
          # Giả sử có bảng ratings để lưu đánh giá
          if defined?(Rating) && Rating.table_exists?
            ratings = Rating.where(rated_user_id: user.user_id)
            return 0 if ratings.empty?
            ratings.average(:score).to_f.round(1)
          else
            # Nếu không có bảng ratings, tính điểm mặc định dựa trên giao dịch
            completion_rate = calculate_completion_rate(user)
            return 0 if completion_rate == 0
            [ completion_rate / 20.0, 5 ].min.round(1) # Chuyển đổi 0-100% thành 0-5 sao
          end
        end

        def calculate_reputation_score(criteria)
          # Trọng số của các yếu tố
          weights = {
            completed_transaction_rate: 0.6,
            average_rating: 0.3,
            time_on_platform: 0.1
          }

          # Chuẩn hóa thời gian trên nền tảng (0-5)
          time_score = [ criteria[:time_on_platform] / 180.0, 5 ].min

          # Tính điểm tổng hợp
          weighted_score =
            weights[:completed_transaction_rate] * (criteria[:completed_transaction_rate] / 20.0) +
            weights[:average_rating] * criteria[:average_rating] +
            weights[:time_on_platform] * time_score

          # Làm tròn và giới hạn trong khoảng 1-5
          [ [ weighted_score, 5 ].min, 1 ].max.round(1)
        end
      end
    end
  end
end
