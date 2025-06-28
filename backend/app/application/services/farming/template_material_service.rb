module Services::Farming
  class TemplateMaterialService
    def initialize(template)
      @template = template
    end

    # Thêm vật tư vào template
    def add_material(material_id, quantity, user_id)
      # Kiểm tra quyền chỉnh sửa template
      unless can_edit_template?(user_id)
        return { success: false, error: "Không có quyền chỉnh sửa template này" }
      end

      # Kiểm tra vật tư có tồn tại không
      farm_material = Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: material_id)
      unless farm_material
        return { success: false, error: "Không tìm thấy vật tư" }
      end

      # Kiểm tra vật tư đã tồn tại trong template chưa
      existing_material = @template.template_activity_materials
                                  .find_by(farm_material_id: material_id)
      
      if existing_material
        return { success: false, error: "Vật tư này đã có trong template" }
      end

      # Tạo template activity material
      template_material = @template.template_activity_materials.build(
        farm_material: farm_material,
        quantity: quantity
      )

      if template_material.save
        { 
          success: true, 
          message: "Đã thêm vật tư vào template",
          template_material: template_material
        }
      else
        { 
          success: false, 
          error: "Không thể thêm vật tư",
          errors: template_material.errors.full_messages 
        }
      end
    end

    # Cập nhật số lượng vật tư trong template
    def update_material_quantity(template_material_id, quantity, user_id)
      # Kiểm tra quyền chỉnh sửa template
      unless can_edit_template?(user_id)
        return { success: false, error: "Không có quyền chỉnh sửa template này" }
      end

      template_material = @template.template_activity_materials.find_by(id: template_material_id)
      unless template_material
        return { success: false, error: "Không tìm thấy vật tư trong template" }
      end

      if template_material.update(quantity: quantity)
        { 
          success: true, 
          message: "Đã cập nhật vật tư trong template",
          template_material: template_material
        }
      else
        { 
          success: false, 
          error: "Không thể cập nhật vật tư",
          errors: template_material.errors.full_messages 
        }
      end
    end

    # Xóa vật tư khỏi template
    def remove_material(template_material_id, user_id)
      # Kiểm tra quyền chỉnh sửa template
      unless can_edit_template?(user_id)
        return { success: false, error: "Không có quyền chỉnh sửa template này" }
      end

      template_material = @template.template_activity_materials.find_by(id: template_material_id)
      unless template_material
        return { success: false, error: "Không tìm thấy vật tư trong template" }
      end

      if template_material.destroy
        { success: true, message: "Đã xóa vật tư khỏi template" }
      else
        { 
          success: false, 
          error: "Không thể xóa vật tư",
          errors: template_material.errors.full_messages 
        }
      end
    end

    # Thêm nhiều vật tư cùng lúc
    def add_materials_batch(materials_data, user_id)
      # Kiểm tra quyền chỉnh sửa template
      unless can_edit_template?(user_id)
        return { success: false, error: "Không có quyền chỉnh sửa template này" }
      end

      success_count = 0
      errors = []

      ActiveRecord::Base.transaction do
        materials_data.each do |material_data|
          result = add_material(
            material_data[:material_id], 
            material_data[:quantity], 
            user_id
          )
          
          if result[:success]
            success_count += 1
          else
            errors << result[:error]
          end
        end

        if errors.any?
          raise ActiveRecord::Rollback
        end
      end

      if errors.any?
        { 
          success: false, 
          error: "Có lỗi khi thêm vật tư",
          errors: errors,
          success_count: success_count
        }
      else
        { 
          success: true, 
          message: "Đã thêm #{success_count} vật tư vào template"
        }
      end
    end

    # Kiểm tra tính khả thi của template (có đủ vật tư không)
    def check_feasibility(user_id)
      insufficient_materials = []
      total_cost = 0

      @template.template_activity_materials.includes(:farm_material).each do |template_material|
        material = template_material.farm_material
        
        # Kiểm tra user có vật tư tương ứng trong kho không
        user_material = Models::Farming::FarmMaterial.where(user_id: user_id)
                                                    .where(name: material.name)
                                                    .where(category: material.category)
                                                    .first
        
        unless user_material
          insufficient_materials << {
            material_name: material.name,
            reason: "Không có vật tư này trong kho"
          }
          next
        end

        # Kiểm tra số lượng có đủ không
        unless user_material.available_quantity >= template_material.quantity
          insufficient_materials << {
            material_name: material.name,
            required: template_material.quantity,
            available: user_material.available_quantity,
            unit: user_material.unit,
            reason: "Không đủ số lượng"
          }
        end

        # Tính chi phí (nếu có)
        if user_material.respond_to?(:unit_cost) && user_material.unit_cost
          total_cost += user_material.unit_cost * template_material.quantity
        end
      end

      {
        feasible: insufficient_materials.empty?,
        insufficient_materials: insufficient_materials,
        total_cost: total_cost,
        materials_count: @template.template_activity_materials.count
      }
    end

    # Lấy thống kê vật tư trong template
    def get_materials_statistics(user_id = nil)
      materials = @template.template_activity_materials.includes(:farm_material)
      
      statistics = {
        total_materials: materials.count,
        total_quantity: materials.sum(:quantity),
        by_category: {},
        cost_estimate: 0
      }

      # Thống kê theo loại
      Models::Farming::FarmMaterial.categories.keys.each do |category|
        category_materials = materials.joins(:farm_material).where(farm_materials: { category: category })
        if category_materials.any?
          statistics[:by_category][category] = {
            count: category_materials.count,
            total_quantity: category_materials.sum(:quantity),
            materials: category_materials.map do |tm|
              {
                id: tm.id,
                material_name: tm.farm_material.name,
                quantity: tm.quantity,
                unit: tm.farm_material.unit
              }
            end
          }
        end
      end

      # Tính chi phí ước tính
      materials.each do |template_material|
        material = template_material.farm_material
        if material.respond_to?(:unit_cost) && material.unit_cost
          statistics[:cost_estimate] += material.unit_cost * template_material.quantity
        end
      end

      # Thêm thông tin feasibility nếu có user_id
      if user_id
        feasibility = check_feasibility(user_id)
        statistics[:feasibility] = feasibility
      end

      statistics
    end

    # So sánh template với kho hiện tại
    def compare_with_inventory(user_id)
      comparison = {
        template_id: @template.id,
        template_name: @template.name,
        materials: [],
        summary: {
          total_materials: 0,
          sufficient_materials: 0,
          insufficient_materials: 0,
          missing_materials: 0
        }
      }

      @template.template_activity_materials.includes(:farm_material).each do |template_material|
        material = template_material.farm_material
        
        material_comparison = {
          material_id: material.id,
          material_name: material.name,
          category: material.category,
          unit: material.unit,
          required_quantity: template_material.quantity,
          available_quantity: 0,
          sufficient: false,
          status: "missing"
        }

        # Kiểm tra vật tư có trong kho không
        user_material = Models::Farming::FarmMaterial.where(user_id: user_id).find_by(id: material.id)
        
        if user_material
          material_comparison[:available_quantity] = user_material.available_quantity
          material_comparison[:sufficient] = user_material.available_quantity >= template_material.quantity
          material_comparison[:status] = material_comparison[:sufficient] ? "sufficient" : "insufficient"
        else
          material_comparison[:status] = "missing"
        end

        comparison[:materials] << material_comparison

        # Cập nhật summary
        comparison[:summary][:total_materials] += 1
        case material_comparison[:status]
        when "sufficient"
          comparison[:summary][:sufficient_materials] += 1
        when "insufficient"
          comparison[:summary][:insufficient_materials] += 1
        when "missing"
          comparison[:summary][:missing_materials] += 1
        end
      end

      comparison
    end

    private

    def can_edit_template?(user_id)
      # Chỉ user tạo template mới có quyền chỉnh sửa
      @template.user_id.nil? || @template.user_id == user_id
    end
  end
end 