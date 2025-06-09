module Api
  module V1
    module Marketplace
      class MarketplaceHarvestsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!
        before_action :set_marketplace_harvest, only: [ :show, :update, :destroy, :upload_payment_proof ]
        before_action :set_product_listing, only: [ :create ]

        # GET /api/v1/marketplace/harvests
        def index
          if current_user.farmer?
            # Hộ sản xuất xem lịch thu hoạch của mình
            harvests = ::Marketplace::MarketplaceHarvest.joins(:product_listing)
                                        .where(product_listings: { user_id: current_user.user_id })
          else
            # Thương lái xem lịch thu hoạch đã đặt
            harvests = ::Marketplace::MarketplaceHarvest.where(trader_id: current_user.user_id)
          end

          # Lọc theo trạng thái nếu có
          harvests = harvests.where(status: params[:status]) if params[:status].present?

          @pagy, harvests = pagy(harvests.includes(:product_listing).order(scheduled_date: :desc))

          render json: {
            harvests: harvests.map { |h| harvest_response(h) },
            pagination: pagy_metadata(@pagy)
          }
        end

        # GET /api/v1/marketplace/harvests/:id
        def show
          render json: {
            harvest: harvest_response(@marketplace_harvest)
          }
        end

        # POST /api/v1/marketplace/harvests
        def create
          harvest = current_user.marketplace_harvests.new(marketplace_harvest_params) # Đổi harvests thành marketplace_harvests
          service = ::Marketplace::HarvestService.new(harvest, current_user)
          result = service.create(params, @product_listing)
          
          if result[:success]
            render json: {
              message: "Đã lên lịch thu hoạch thành công",
              harvest: harvest_response(result[:harvest])
            }, status: :created
          else
            render json: { errors: result[:errors] || [result[:error]] }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/marketplace/harvests/:id
        def update
          service = ::Marketplace::HarvestService.new(@marketplace_harvest, current_user)
          result = service.update(marketplace_harvest_params)
          
          if result[:success]
            render json: {
              message: "Đã cập nhật lịch thu hoạch thành công",
              harvest: harvest_response(result[:harvest])
            }
          else
            render json: { errors: result[:errors] || [result[:error]] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/marketplace/harvests/:id/payment_proof
        def upload_payment_proof
          service = ::Marketplace::HarvestService.new(@marketplace_harvest, current_user)
          result = service.process_payment(params)
          
          if result[:success]
            render json: {
              message: "Đã cập nhật bằng chứng thanh toán thành công",
              harvest: harvest_response(result[:harvest])
            }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/marketplace/harvests/:id
        def destroy
          service = ::Marketplace::HarvestService.new(@marketplace_harvest, current_user)
          result = service.destroy
          
          if result[:success]
            render json: { message: result[:message] }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/marketplace/harvests/active_by_product
        def active_by_product
          unless params[:product_listing_id].present?
            return render json: { error: "Thiếu thông tin sản phẩm" }, status: :unprocessable_entity
          end

          # Tìm lịch thu hoạch mới nhất của sản phẩm
          harvest = ::Marketplace::MarketplaceHarvest.where(product_listing_id: params[:product_listing_id])
                                   .order(created_at: :desc)
                                   .first

          if harvest
            render json: {
              harvest: harvest_response(harvest)
            }
          else
            render json: {
              message: "Không tìm thấy lịch thu hoạch cho sản phẩm này"
            }, status: :not_found
          end
        end

        private

        def set_marketplace_harvest
          @marketplace_harvest = ::Marketplace::MarketplaceHarvest.find_by(id: params[:id])
          render json: { error: "Không tìm thấy lịch thu hoạch" }, status: :not_found unless @marketplace_harvest
        end

        def set_product_listing
          @product_listing = ::Marketplace::ProductListing.find_by(id: params[:product_listing_id])
          render json: { error: "Không tìm thấy sản phẩm" }, status: :not_found unless @product_listing
        end

        def marketplace_harvest_params
          params.require(:marketplace_harvest).permit(
            :scheduled_date,
            :location,
            :notes,
            :estimated_quantity,
            :actual_quantity,
            :estimated_price,
            :final_price,
            :status
          )
        end

        def harvest_response(harvest)
          {
            id: harvest.id,
            scheduled_date: harvest.scheduled_date,
            location: harvest.location,
            notes: harvest.notes,
            estimated_quantity: harvest.estimated_quantity,
            actual_quantity: harvest.actual_quantity,
            estimated_price: harvest.estimated_price,
            final_price: harvest.final_price,
            status: harvest.status,
            payment_proof_url: harvest.payment_proof_url,
            payment_date: harvest.payment_date,
            created_at: harvest.created_at,
            updated_at: harvest.updated_at,
            product_listing: {
              id: harvest.product_listing.id,
              title: harvest.product_listing.title,
              status: harvest.product_listing.status,
              product_type: harvest.product_listing.product_type,
              quantity: harvest.product_listing.quantity,
              price_expectation: harvest.product_listing.price_expectation,
              images: harvest.product_listing.product_images.map(&:image_url).compact
            },
            trader: User.find_by(user_id: harvest.trader_id)&.as_json(only: [ :user_id, :user_name, :fullname, :phone ]),
            farmer: harvest.farmer.as_json(only: [ :user_id, :user_name, :fullname, :phone ])
          }
        end
      end
    end
  end
end
