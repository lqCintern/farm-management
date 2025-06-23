module Controllers::Api
  module V1
    module SupplyChain
      class SupplyListingsController < BaseController
        before_action :authenticate_user!
        before_action :ensure_supplier

        # GET /api/v1/supplier/supply_listings
        def index
          result = Services::CleanArch.supplier_list_listings.execute(current_user.user_id)

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

        # GET /api/v1/supplier/supply_listings/:id
        def show
          result = Services::CleanArch.supplier_get_listing_details.execute(
            params[:id],
            current_user.user_id
          )

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

        # POST /api/v1/supplier/supply_listings
        def create
          listing_params = supply_listing_params.merge(last_updated: Time.current)

          result = Services::CleanArch.supplier_create_listing.execute(
            listing_params,
            current_user.user_id,
            params[:images]
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
              message: "Không thể đăng vật tư",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/supplier/supply_listings/:id
        def update
          listing_params = supply_listing_params.merge(last_updated: Time.current)

          result = Services::CleanArch.supplier_update_listing.execute(
            params[:id],
            listing_params,
            current_user.user_id,
            params[:images],
            params[:delete_all_images] == "true"
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message],
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: "Không thể cập nhật vật tư",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/supplier/supply_listings/:id
        def destroy
          result = Services::CleanArch.supplier_delete_listing.execute(
            params[:id],
            current_user.user_id
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message]
            }
          else
            render json: {
              status: "error",
              message: "Không thể xóa vật tư",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        # PUT /api/v1/supplier/supply_listings/:id/change_status
        def change_status
          result = Services::CleanArch.supplier_change_listing_status.execute(
            params[:id],
            current_user.user_id,
            params[:status]
          )

          if result[:success]
            render json: {
              status: "success",
              message: result[:message],
              data: result[:data]
            }
          else
            render json: {
              status: "error",
              message: "Không thể cập nhật trạng thái",
              errors: result[:errors]
            }, status: :unprocessable_entity
          end
        end

        private

        def supply_listing_params
          params.require(:supply_listing).permit(
            :name, :category, :price, :unit, :quantity,
            :description, :status, :brand, :manufacturer,
            :manufacturing_date, :expiry_date,
            :province, :district, :ward, :address
          )
        end

        def ensure_supplier
          unless current_user.supplier?
            render json: {
              status: "error",
              message: "Bạn không có quyền truy cập chức năng này"
            }, status: :forbidden
          end
        end
      end
    end
  end
end
