module Api
  module V1
    module Farming
      class PineappleCropsController < BaseController
        include PaginationHelper
        before_action :set_pineapple_crop, only: [ :show, :update, :destroy, :generate_plan, :advance_stage, :record_harvest, :confirm_plan, :clean_activities ]

        def index
          pineapple_crops = current_user.pineapple_crops

          # Bộ lọc
          pineapple_crops = pineapple_crops.where(season_type: params[:season_type]) if params[:season_type].present?
          pineapple_crops = pineapple_crops.where(field_id: params[:field_id]) if params[:field_id].present?
          pineapple_crops = pineapple_crops.where(status: params[:status]) if params[:status].present?
          pineapple_crops = pineapple_crops.where(current_stage: params[:stage]) if params[:stage].present?

          @pagy, pineapple_crops = pagy(pineapple_crops.order(created_at: :desc), items: 10)

          render json: {
            data: pineapple_crops,
            pagination: pagy_metadata(@pagy)
          }, status: :ok
        end

        def show
          render json: { data: @pineapple_crop }, status: :ok
        end

        def create
          # Kiểm tra xem field đã có mùa vụ hiện tại hay chưa
          existing_crop = PineappleCrop.find_by(field_id: pineapple_crop_params[:field_id], status: "active")

          if existing_crop
            render json: { error: "Field này đã có một mùa vụ đang hoạt động" }, status: :unprocessable_entity
            return
          end

          # Nếu không có mùa vụ hiện tại, tạo mùa vụ mới
          service = ::Farming::PineappleCropService.new(PineappleCrop.new, current_user)
          pineapple_crop = service.create(pineapple_crop_params)

          if pineapple_crop.errors.empty?
            render json: {
              message: "Đã tạo vụ trồng dứa thành công",
              data: pineapple_crop
            }, status: :created
          else
            render json: { errors: pineapple_crop.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          service = ::Farming::PineappleCropService.new(@pineapple_crop, current_user)
          pineapple_crop = service.update(pineapple_crop_params)

          if pineapple_crop.errors.empty?
            render json: {
              message: "Đã cập nhật vụ trồng dứa thành công",
              data: pineapple_crop
            }, status: :ok
          else
            render json: { errors: pineapple_crop.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          if @pineapple_crop.destroy
            render json: { message: "Đã xóa vụ trồng dứa thành công" }, status: :ok
          else
            render json: { errors: @pineapple_crop.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def generate_plan
          service = ::Farming::PineappleCropService.new(@pineapple_crop, current_user)

          if service.generate_full_plan
            render json: {
              message: "Đã tạo kế hoạch trồng dứa thành công",
              data: @pineapple_crop
            }, status: :ok
          else
            render json: { error: "Không thể tạo kế hoạch. Vui lòng kiểm tra ngày trồng." }, status: :unprocessable_entity
          end
        end

        def advance_stage
          service = ::Farming::PineappleCropService.new(@pineapple_crop, current_user)

          if service.advance_to_next_stage
            render json: {
              message: "Đã chuyển sang giai đoạn tiếp theo",
              data: @pineapple_crop
            }, status: :ok
          else
            render json: { error: "Không thể chuyển giai đoạn" }, status: :unprocessable_entity
          end
        end

        def record_harvest
          service = ::Farming::PineappleCropService.new(@pineapple_crop, current_user)

          if service.record_harvest(params[:quantity].to_f)
            render json: {
              message: "Đã ghi nhận thu hoạch thành công",
              data: @pineapple_crop
            }, status: :ok
          else
            render json: { error: "Không thể ghi nhận thu hoạch" }, status: :unprocessable_entity
          end
        end

        def preview_plan
          crop_params = pineapple_crop_params
          service = ::Farming::PineappleCropService.new(nil, current_user)
          preview_activities = service.preview_plan(crop_params)

          render json: {
            preview_activities: ApiRendererService.render_farm_activities(preview_activities, nil)[:farm_activities]
          }, status: :ok
        end

        def confirm_plan
          activities_params = params.require(:activities) # array các công đoạn đã chỉnh sửa

          service = ::Farming::PineappleCropService.new(@pineapple_crop, current_user)
          created_activities = service.save_plan(activities_params)

          render json: {
            message: "Đã lưu kế hoạch công việc thành công",
            activities: ApiRendererService.render_farm_activities(created_activities, nil)[:farm_activities]
          }, status: :ok
        end

        def statistics
          overview = {
            total_crops: current_user.pineapple_crops.count,
            active_crops: current_user.pineapple_crops.active.count,
            harvested_crops: current_user.pineapple_crops.harvested.count,
            by_season: {
              spring_summer: current_user.pineapple_crops.spring_summer.count,
              fall_winter: current_user.pineapple_crops.fall_winter.count
            },
            by_stage: PineappleCrop.current_stages.keys.map { |stage|
              { stage: stage, count: current_user.pineapple_crops.in_stage(stage).count }
            },
            upcoming_harvests: current_user.pineapple_crops.coming_harvest.count
          }

          render json: { statistics: overview }, status: :ok
        end

        def clean_activities
          service = ::Farming::PineappleCropService.new(@pineapple_crop, current_user)

          if service.clean_and_regenerate
            render json: { message: "Đã dọn dẹp và tạo lại hoạt động thành công" }, status: :ok
          else
            render json: { error: "Không thể dọn dẹp hoạt động" }, status: :unprocessable_entity
          end
        end

        private

        def set_pineapple_crop
          @pineapple_crop = current_user.pineapple_crops.find_by(id: params[:id])
          render json: { error: "Không tìm thấy vụ trồng dứa" }, status: :not_found unless @pineapple_crop
        end

        def pineapple_crop_params
          params.require(:pineapple_crop).permit(
            :name, :field_id, :planting_date, :harvest_date,
            :field_area, :season_type, :planting_density,
            :status, :description, :variety, :source,
            :current_stage, :expected_yield, :location
          )
        end
      end
    end
  end
end
