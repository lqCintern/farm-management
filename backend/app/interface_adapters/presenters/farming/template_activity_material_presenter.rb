module Presenters::Farming
  class TemplateActivityMaterialPresenter < BasePresenter
    def as_json
      {
        id: @object.id,
        material_id: @object.farm_material_id,
        material_name: @object.farm_material.name,
        quantity: @object.quantity,
        unit: @object.farm_material.unit,
        category: @object.farm_material.category,
        created_at: @object.created_at,
        updated_at: @object.updated_at
      }
    end

    def self.collection_as_json(template_materials)
      template_materials.map { |tm| new(tm).as_json }
    end

    def self.format_create_response(result)
      if result[:success]
        {
          success: true,
          message: "Đã thêm vật tư vào template",
          data: new(result[:template_material]).as_json
        }
      else
        {
          error: "Không thể thêm vật tư",
          errors: result[:errors]
        }
      end
    end

    def self.format_update_response(result)
      if result[:success]
        {
          success: true,
          message: "Đã cập nhật vật tư trong template",
          data: new(result[:template_material]).as_json
        }
      else
        {
          error: "Không thể cập nhật vật tư",
          errors: result[:errors]
        }
      end
    end

    def self.format_batch_create_response(result)
      if result[:success]
        {
          success: true,
          message: "Đã thêm #{result[:success_count]} vật tư vào template",
          data: collection_as_json(result[:template_materials]),
          errors: result[:errors]
        }
      else
        {
          error: "Không thể thêm vật tư",
          errors: result[:errors]
        }
      end
    end

    def self.format_statistics_response(result)
      if result[:success]
        {
          success: true,
          statistics: result[:statistics]
        }
      else
        {
          error: "Không thể lấy thống kê"
        }
      end
    end

    def self.format_feasibility_response(result)
      if result[:success]
        {
          success: true,
          feasibility: result[:feasibility]
        }
      else
        {
          error: "Không thể kiểm tra tính khả thi"
        }
      end
    end

    def self.format_inventory_comparison_response(result)
      if result[:success]
        {
          success: true,
          comparison: result[:comparison]
        }
      else
        {
          error: "Không thể so sánh với kho"
        }
      end
    end
  end
end 