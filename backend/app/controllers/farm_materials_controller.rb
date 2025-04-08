class FarmMaterialsController < ApplicationController
  load_and_authorize_resource

  # Lấy danh sách vật tư
  def index
    materials = current_user.farm_materials.page(params[:page]).per(10)
    render json: materials, status: :ok
  end

  # Thêm mới vật tư
  def create
    material = current_user.farm_materials.new(material_params)
    if material.save
      render json: material, status: :created
    else
      render json: { errors: material.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # Xem chi tiết vật tư
  def show
    render json: @material, status: :ok
  end

  # Cập nhật vật tư
  def update
    if @material.update(material_params)
      render json: @material, status: :ok
    else
      render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # Xóa vật tư
  def destroy
    @material.destroy
    render json: { message: "Material deleted successfully" }, status: :ok
  end

  private

  def material_params
    params.require(:material).permit(:name, :price, :source, :stock)
  end
end
