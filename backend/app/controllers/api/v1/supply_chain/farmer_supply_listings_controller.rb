module Api
  module V1
    module SupplyChain
      class SupplyListingsController < BaseController
        before_action :authenticate_user!, except: [ :index, :show ]
        before_action :set_supply_listing, only: [ :show ]

        # GET /api/v1/supply_listings
        def index
          @supply_listings = SupplyListing.where(status: :active)
                                        .includes(:user, supply_images: { image_attachment: :blob })
                                        .order(created_at: :desc)

          # Lọc theo danh mục
          @supply_listings = @supply_listings.where(category: params[:category]) if params[:category].present?

          # Lọc theo vị trí địa lý
          @supply_listings = @supply_listings.where(province: params[:province]) if params[:province].present?
          @supply_listings = @supply_listings.where(district: params[:district]) if params[:district].present?

          # Lọc theo khoảng giá
          if params[:min_price].present? && params[:max_price].present?
            @supply_listings = @supply_listings.where(price: params[:min_price]..params[:max_price])
          elsif params[:min_price].present?
            @supply_listings = @supply_listings.where("price >= ?", params[:min_price])
          elsif params[:max_price].present?
            @supply_listings = @supply_listings.where("price <= ?", params[:max_price])
          end

          # Tìm kiếm theo tên
          @supply_listings = @supply_listings.where("name LIKE ?", "%#{params[:name]}%") if params[:name].present?

          # Phân trang
          page = params[:page] || 1
          per_page = params[:per_page] || 15
          @supply_listings = @supply_listings.page(page).per(per_page)

          render json: {
            status: "success",
            total_pages: @supply_listings.total_pages,
            current_page: @supply_listings.current_page,
            total_count: @supply_listings.total_count,
            data: @supply_listings.map { |listing| supply_listing_json(listing) }
          }
        end

        # GET /api/v1/supply_listings/:id
        def show
          # Tăng số lượt xem
          @supply_listing.increment!(:view_count)

          render json: {
            status: "success",
            data: supply_listing_json(@supply_listing, true)
          }
        end

        # GET /api/v1/supply_listings/categories
        def categories
          categories = SupplyListing.categories.keys.map do |category|
            {
              value: category,
              label: I18n.t("supply_listing.categories.#{category}")
            }
          end

          render json: {
            status: "success",
            data: categories
          }
        end

        private

        def set_supply_listing
          @supply_listing = SupplyListing.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: {
            status: "error",
            message: "Không tìm thấy vật tư"
          }, status: :not_found
        end

        def supply_listing_json(listing, detailed = false)
          json = {
            id: listing.id,
            name: listing.name,
            category: listing.category,
            price: listing.price,
            unit: listing.unit,
            quantity: listing.quantity,
            status: listing.status,
            created_at: listing.created_at,
            updated_at: listing.updated_at,
            main_image: listing.supply_images.sorted.first&.image_url,
            supplier: {
              id: listing.user.user_id,
              name: listing.user.user_name
            }
          }

          if detailed
            supplier_rating = listing.user.average_rating

            json.merge!({
              description: listing.description,
              brand: listing.brand,
              manufacturer: listing.manufacturer,
              manufacturing_date: listing.manufacturing_date,
              expiry_date: listing.expiry_date,
              province: listing.province,
              district: listing.district,
              ward: listing.ward,
              address: listing.address,
              view_count: listing.view_count,
              supplier: {
                id: listing.user.user_id,
                name: listing.user.user_name,
                phone: listing.user.phone,
                address: listing.user.address,
                average_rating: supplier_rating
              },
              images: listing.supply_images.sorted.map do |img|
                {
                  id: img.id,
                  url: img.image_url,
                  position: img.position
                }
              end,
              similar_listings: SupplyListing.where(category: listing.category)
                                          .where.not(id: listing.id)
                                          .where(status: :active)
                                          .limit(6)
                                          .map { |l| supply_listing_json(l) }
            })
          end

          json
        end
      end
    end
  end
end
