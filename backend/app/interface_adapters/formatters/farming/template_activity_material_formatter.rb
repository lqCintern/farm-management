module Formatters
  module Farming
    class TemplateActivityMaterialFormatter
      # Format params cho tạo template material
      def self.format_create_params(params)
        {
          material_id: params[:material_id],
          quantity: params[:quantity]
        }.compact
      end

      # Format params cho cập nhật template material
      def self.format_update_params(params)
        {
          quantity: params[:quantity]
        }.compact
      end

      # Format params cho batch create
      def self.format_batch_create_params(params)
        return [] unless params[:materials].is_a?(Array)

        params[:materials].map do |material_data|
          {
            material_id: material_data[:material_id],
            quantity: material_data[:quantity]
          }.compact
        end
      end

      # Format response cho template material
      def self.format_template_material_response(template_material)
        {
          id: template_material.id,
          material_id: template_material.farm_material_id,
          material_name: template_material.farm_material.name,
          quantity: template_material.quantity,
          unit: template_material.farm_material.unit,
          category: template_material.farm_material.category,
          created_at: template_material.created_at,
          updated_at: template_material.updated_at
        }
      end

      # Format collection response
      def self.format_collection_response(template_materials)
        template_materials.map { |tm| format_template_material_response(tm) }
      end
    end
  end
end 