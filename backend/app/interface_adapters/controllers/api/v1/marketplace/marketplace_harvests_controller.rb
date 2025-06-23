module Controllers::Api
  module V1
    module Marketplace
      class MarketplaceHarvestsController < BaseController
        include Pagy::Backend

        before_action :authenticate_user!

        # GET /api/v1/marketplace/harvests
        def index
          pagy, harvests = Services::CleanArch.marketplace_list_harvests.execute(
            user_id: current_user.user_id,
            user_type: current_user.user_type,
            status: params[:status],
            page: params[:page] || 1,
            per_page: params[:per_page] || 10
          )

          render json: {
            harvests: harvests.map { |h| harvest_response(h) },
            pagination: {
              current_page: pagy.page,
              total_pages: pagy.pages,
              total_items: pagy.count
            }
          }
        end

        # GET /api/v1/marketplace/harvests/:id
        def show
          result = Services::CleanArch.marketplace_get_harvest_details.execute(params[:id])

          if result[:success]
            render json: {
              harvest: harvest_response(result[:harvest])
            }
          else
            render json: { error: result[:error] }, status: :not_found
          end
        end

        # POST /api/v1/marketplace/harvests
        def create
          result = Services::CleanArch.marketplace_create_harvest.execute(
            marketplace_harvest_params.to_h,
            current_user.user_id,
            params[:product_listing_id]
          )

          if result[:success]
            render json: {
              message: result[:message],
              harvest: harvest_response(result[:harvest])
            }, status: :created
          else
            render json: { errors: [ result[:error] ] }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/marketplace/harvests/:id
        def update
          result = Services::CleanArch.marketplace_update_harvest.execute(
            params[:id],
            marketplace_harvest_params.to_h,
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: result[:message],
              harvest: harvest_response(result[:harvest])
            }
          else
            render json: { errors: [ result[:error] ] }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/marketplace/harvests/:id/payment_proof
        def upload_payment_proof
          result = Services::CleanArch.marketplace_process_payment.execute(
            params[:id],
            params[:payment_proof],
            current_user.user_id
          )

          if result[:success]
            render json: {
              message: result[:message],
              harvest: harvest_response(result[:harvest])
            }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/marketplace/harvests/:id
        def destroy
          result = Services::CleanArch.marketplace_delete_harvest.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: { message: result[:message] }
          else
            render json: { error: result[:error] }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/marketplace/harvests/active_by_product
        def active_by_product
          result = Services::CleanArch.marketplace_get_active_by_product.execute(
            params[:product_listing_id]
          )

          if result[:success]
            render json: {
              harvest: harvest_response(result[:harvest])
            }
          else
            status = result[:message] ? :not_found : :unprocessable_entity
            message_key = result[:error] ? :error : :message
            render json: { message_key => result[message_key] }, status: status
          end
        end

        private

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
            trader: harvest.trader_data,
            farmer: harvest.farmer_data
          }
        end
      end
    end
  end
end
